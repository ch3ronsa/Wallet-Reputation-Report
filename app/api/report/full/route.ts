import { createMoonPayAdapter } from "@/adapters/moonpay";
import { createOwsAdapter } from "@/adapters/ows";
import { createX402PaymentGate } from "@/adapters/x402";
import { env, resolveRuntimeMode } from "@/config/env";
import { parseReportRequest } from "@/lib/validation";
import { generateWalletReport } from "@/reports/generate-report";
import { FullReportResponse } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reportRequest = parseReportRequest(body);
    const x402Gate = createX402PaymentGate();
    const moonPayAdapter = createMoonPayAdapter();
    const owsAdapter = createOwsAdapter();
    const access = await x402Gate.checkAccess({ request, reportRequest });

    if (!access.paid) {
      const requirements = access.requirements ?? [];
      const serviceIdentity = await owsAdapter.getServiceIdentity();
      const owsCommands = await owsAdapter.buildBuyerCommands(reportRequest);
      const moonPayPlan = await moonPayAdapter.getFundingPlan({
        walletAddress: serviceIdentity.address,
        chain: reportRequest.chain,
      });

      return NextResponse.json<FullReportResponse>(
        {
          mode: resolveRuntimeMode(env.x402Mode),
          error: "Payment required for premium report.",
          requirements,
          owsCommands,
          moonpay: moonPayPlan,
        },
        {
          status: 402,
          headers: {
            "PAYMENT-REQUIRED": x402Gate.encodePaymentRequiredHeader(requirements),
          },
        },
      );
    }

    const report = await generateWalletReport(reportRequest);

    return NextResponse.json<FullReportResponse>({
      mode: report.wallet.dataSource === "allium" ? "real" : "mock",
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate premium report.";
    return NextResponse.json<FullReportResponse>(
      { mode: resolveRuntimeMode(env.x402Mode), error: message },
      { status: 400 },
    );
  }
}
