import { AlliumClient } from "@/lib/allium/client";
import { buildPremiumInsights, buildSummary, buildWalletMetrics, scoreWallet } from "@/lib/scoring/engine";
import { WalletReport, WalletReportRequest } from "@/types/report";

const alliumClient = new AlliumClient();

export async function buildWalletReport(request: WalletReportRequest): Promise<WalletReport> {
  const snapshot = await alliumClient.getWalletSnapshot(request);
  const metrics = buildWalletMetrics(snapshot);
  const score = scoreWallet(metrics);

  return {
    request,
    metrics,
    score,
    summary: buildSummary(score, metrics),
    premiumInsights: buildPremiumInsights(metrics, score),
    generatedAt: new Date().toISOString(),
  };
}
