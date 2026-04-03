import { env } from "@/config/env";
import { PaymentAccessResult, X402PaymentGate } from "@/types/adapters";
import { WalletLookupRequest, X402PaymentRequirement } from "@/types/api";
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

export class MockX402PaymentGate implements X402PaymentGate {
  async checkAccess(input: {
    request: NextRequest;
    reportRequest: WalletLookupRequest;
  }): Promise<PaymentAccessResult> {
    const paymentHeader = input.request.headers.get("x-demo-payment");
    const paid = paymentHeader === env.demoPaidHeaderValue;

    return paid ? { paid: true } : { paid: false, requirements: buildRequirements() };
  }

  encodePaymentRequiredHeader(requirements: X402PaymentRequirement[]): string {
    return Buffer.from(JSON.stringify({ accepts: requirements }), "utf8").toString("base64");
  }
}
