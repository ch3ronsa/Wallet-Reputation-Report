import { X402_ASSUMPTIONS } from "@/adapters/x402/assumptions";
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

function buildPendingSession(reportRequest: WalletLookupRequest, sessionId: string): UnlockSession {
  return {
    sessionId,
    state: "pending",
    requirements: buildRequirements(),
    checkoutUrl: X402_ASSUMPTIONS.mock.checkoutUrl,
    verifyAfterMs: env.x402MockSettleMs,
    ctaLabel: "Pay to unlock full report",
    message:
      "Payment pending. Complete the x402 demo payment flow, then verify to reveal the premium report.",
  };
}

export class MockX402PaymentGate implements X402PaymentGate {
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

    return { paid: false, requirements: buildRequirements() };
  }

  async createUnlockSession(input: { reportRequest: WalletLookupRequest }): Promise<UnlockSession> {
    const sessionId = createSignedSessionToken(input.reportRequest);
    return buildPendingSession(input.reportRequest, sessionId);
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
        failureReason: "The unlock session is invalid, expired, or does not match this report request.",
      };
    }

    const elapsedMs = Date.now() - session.issuedAt;
    const demoPaid = input.request.headers.get(X402_ASSUMPTIONS.headers.demoPayment) === env.demoPaidHeaderValue;
    const autoApproved = env.x402MockAutoApprove && elapsedMs >= env.x402MockSettleMs;

    if (!demoPaid && !autoApproved) {
      return {
        ...buildPendingSession(input.reportRequest, input.sessionId),
        message: "Payment is still pending. Verify again after the settlement window or complete the demo payment flag.",
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
