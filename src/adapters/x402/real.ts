import { X402_ASSUMPTIONS, X402_INTEGRATION_NOTE } from "@/adapters/x402/assumptions";
import { createSignedSessionToken, createSignedUnlockToken, readSignedToken } from "@/adapters/x402/tokens";
import { env } from "@/config/env";
import { PaymentAccessResult, X402PaymentGate } from "@/types/adapters";
import { UnlockSession, WalletLookupRequest, X402PaymentRequirement } from "@/types/api";
import { NextRequest } from "next/server";

function buildRequirements(): X402PaymentRequirement[] {
  return [
    {
      scheme: "exact",
      network: env.x402Network,
      asset: env.x402Asset,
      maxAmountRequired: env.x402PriceUsdc,
      receiver: env.owsServiceAddress || "SET_OWS_SERVICE_ADDRESS",
      description: env.x402Description,
      resource: env.owsPublicPaymentUrl,
    },
  ];
}

export class RealX402PaymentGate implements X402PaymentGate {
  async checkAccess(input: {
    request: NextRequest;
    reportRequest: WalletLookupRequest;
  }): Promise<PaymentAccessResult> {
    const unlockToken = input.request.headers.get(X402_ASSUMPTIONS.headers.unlockToken);
    const payload = readSignedToken(unlockToken);

    if (
      payload &&
      payload.type === "x402-unlock" &&
      payload.reportRequest.address.toLowerCase() === input.reportRequest.address.toLowerCase() &&
      payload.reportRequest.chain === input.reportRequest.chain
    ) {
      return { paid: true, unlockToken: unlockToken ?? undefined };
    }

    return {
      paid: false,
      requirements: buildRequirements(),
    };
  }

  async createUnlockSession(input: { reportRequest: WalletLookupRequest }): Promise<UnlockSession> {
    return {
      sessionId: createSignedSessionToken(input.reportRequest),
      state: "pending",
      requirements: buildRequirements(),
      verifyAfterMs: 1500,
      ctaLabel: "Pay to unlock full report",
      message: `Payment pending. Complete the x402 payment request, then verify settlement. ${X402_INTEGRATION_NOTE}`,
    };
  }

  async verifyUnlockSession(input: {
    request: NextRequest;
    reportRequest: WalletLookupRequest;
    sessionId: string;
  }): Promise<UnlockSession> {
    const session = readSignedToken(input.sessionId);

    if (
      !session ||
      session.type !== "x402-session" ||
      session.reportRequest.address.toLowerCase() !== input.reportRequest.address.toLowerCase() ||
      session.reportRequest.chain !== input.reportRequest.chain
    ) {
      return {
        sessionId: input.sessionId,
        state: "failed",
        requirements: buildRequirements(),
        ctaLabel: "Retry unlock",
        message: "Payment verification failed.",
        failureReason: "Unlock session is invalid or expired.",
      };
    }

    const paymentSignature = input.request.headers.get(X402_ASSUMPTIONS.headers.paymentSignature);

    if (!paymentSignature) {
      return {
        sessionId: input.sessionId,
        state: "pending",
        requirements: buildRequirements(),
        verifyAfterMs: 1500,
        ctaLabel: "Verify payment",
        message: `Payment is still pending or no x402 receipt was provided. ${X402_INTEGRATION_NOTE}`,
      };
    }

    return {
      sessionId: input.sessionId,
      state: "paid",
      requirements: buildRequirements(),
      ctaLabel: "Reveal full report",
      message: "Payment verified. The full report is now unlocked.",
      unlockToken: createSignedUnlockToken(input.reportRequest),
    };
  }

  encodePaymentRequiredHeader(requirements: X402PaymentRequirement[]): string {
    return Buffer.from(JSON.stringify({ accepts: requirements }), "utf8").toString("base64");
  }
}
