import { env, resolveRuntimeMode } from "@/config/env";
import { parseReportRequest } from "@/lib/validation";
import { generateWalletReport } from "@/reports/generate-report";
import { FreeReportResponse } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reportRequest = parseReportRequest(body);
    const report = await generateWalletReport(reportRequest);

    return NextResponse.json<FreeReportResponse>({
      mode: resolveRuntimeMode(env.alliumMode),
      report: {
        wallet: report.wallet,
        generatedAt: report.generatedAt,
        summary: report.summary,
        score: report.score,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate free report.";
    return NextResponse.json<FreeReportResponse>(
      { mode: resolveRuntimeMode(env.alliumMode), error: message },
      { status: 400 },
    );
  }
}
