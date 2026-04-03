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
      dataMode: report.wallet.dataSource === "allium" ? "real" : "mock",
      report: report.freeSummary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate free report.";
    return NextResponse.json<FreeReportResponse>(
      { dataMode: "mock", error: message },
      { status: 400 },
    );
  }
}
