import { env } from "@/config/env";
import { PremiumAccessResult, X402PaymentRequirement } from "@/types/report";
import { NextRequest } from "next/server";

const PAYMENT_SIGNATURE_HEADER = "payment-signature";
const DEV_UNLOCK_HEADER = "x-demo-payment";

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

export async function checkPremiumAccess(request: NextRequest): Promise<PremiumAccessResult> {
  const paymentSignature = request.headers.get(PAYMENT_SIGNATURE_HEADER);
  const demoUnlock = request.headers.get(DEV_UNLOCK_HEADER);

  if (paymentSignature || demoUnlock === "paid") {
    return { paid: true };
  }

  return {
    paid: false,
    requirements: buildRequirements(),
  };
}

export function encodePaymentRequiredHeader(requirements: X402PaymentRequirement[]): string {
  return Buffer.from(JSON.stringify({ accepts: requirements }), "utf8").toString("base64");
}
