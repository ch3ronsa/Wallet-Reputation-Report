import { getMoonPayFundingGuide } from "@/lib/moonpay/helpers";
import { checkPremiumAccess, encodePaymentRequiredHeader } from "@/lib/payments/x402";
import { buildWalletReport } from "@/lib/reports/build-report";
import { getOwsCommands } from "@/lib/ows/commands";
import { parseReportRequest } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const access = await checkPremiumAccess(request);
    const body = await request.json();
    const reportRequest = parseReportRequest(body);

    if (!access.paid) {
      const requirements = access.requirements ?? [];

      return NextResponse.json(
        {
          error: "Payment required for premium report.",
          requirements,
          owsCommands: getOwsCommands(reportRequest.address, reportRequest.chain),
          moonpay: getMoonPayFundingGuide(),
        },
        {
          status: 402,
          headers: {
            "PAYMENT-REQUIRED": encodePaymentRequiredHeader(requirements),
          },
        },
      );
    }

    const report = await buildWalletReport(reportRequest);

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate premium report.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
