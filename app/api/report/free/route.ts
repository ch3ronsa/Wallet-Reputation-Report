import { buildWalletReport } from "@/lib/reports/build-report";
import { parseReportRequest } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reportRequest = parseReportRequest(body);
    const report = await buildWalletReport(reportRequest);

    return NextResponse.json({
      report: {
        request: report.request,
        generatedAt: report.generatedAt,
        summary: report.summary,
        score: report.score,
        metrics: report.metrics,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate free report.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
