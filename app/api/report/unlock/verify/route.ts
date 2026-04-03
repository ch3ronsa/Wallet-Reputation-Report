import { createX402PaymentGate } from "@/adapters/x402";
import { env, resolveRuntimeMode } from "@/config/env";
import { parseReportRequest } from "@/lib/validation";
import { UnlockReportResponse } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, ...rest } = body as Record<string, unknown>;

    if (typeof sessionId !== "string" || !sessionId) {
      return NextResponse.json<UnlockReportResponse>(
        { mode: resolveRuntimeMode(env.x402Mode), error: "Missing unlock session ID." },
        { status: 400 },
      );
    }

    const reportRequest = parseReportRequest(rest);
    const x402Gate = createX402PaymentGate();
    const session = await x402Gate.verifyUnlockSession({
      request,
      reportRequest,
      sessionId,
    });

    return NextResponse.json<UnlockReportResponse>({
      mode: resolveRuntimeMode(env.x402Mode),
      session,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    return NextResponse.json<UnlockReportResponse>(
      { mode: resolveRuntimeMode(env.x402Mode), error: message },
      { status: 400 },
    );
  }
}
