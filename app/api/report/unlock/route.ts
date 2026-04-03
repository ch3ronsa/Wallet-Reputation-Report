import { createX402PaymentGate } from "@/adapters/x402";
import { createMoonPayAdapter } from "@/adapters/moonpay";
import { createOwsAdapter } from "@/adapters/ows";
import { env, resolveRuntimeMode } from "@/config/env";
import { parseReportRequest } from "@/lib/validation";
import { UnlockReportResponse } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reportRequest = parseReportRequest(body);
    const x402Gate = createX402PaymentGate();
    const owsAdapter = createOwsAdapter();
    const moonPayAdapter = createMoonPayAdapter();
    const session = await x402Gate.createUnlockSession({ reportRequest });
    const owsService = await owsAdapter.getServiceIdentity();
    const owsWorkflow = await owsAdapter.buildCliWorkflow({
      reportRequest,
      serviceIdentity: owsService,
    });
    const moonpay = await moonPayAdapter.getFundingPlan({
      walletAddress: undefined,
      chain: reportRequest.chain,
    });

    return NextResponse.json<UnlockReportResponse>({
      mode: resolveRuntimeMode(env.x402Mode),
      session,
      owsService,
      owsWorkflow,
      moonpay,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start unlock flow.";
    return NextResponse.json<UnlockReportResponse>(
      { mode: resolveRuntimeMode(env.x402Mode), error: message },
      { status: 400 },
    );
  }
}
