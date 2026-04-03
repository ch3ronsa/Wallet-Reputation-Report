import { createAlliumClient } from "@/adapters/allium";
import { ReportGenerator } from "@/types/adapters";
import { WalletLookupRequest } from "@/types/api";
import { FullReport } from "@/types/domain";
import { buildPremiumInsights, buildReportSummary, scoreWallet } from "@/scoring/engine";

export class DefaultReportGenerator implements ReportGenerator {
  async generate(request: WalletLookupRequest): Promise<FullReport> {
    const alliumClient = createAlliumClient();
    const wallet = await alliumClient.getWalletProfile(request);
    const score = scoreWallet(wallet.metrics);

    return {
      wallet,
      score,
      summary: buildReportSummary(score, wallet.metrics),
      premiumInsights: buildPremiumInsights(wallet.metrics, score),
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function generateWalletReport(request: WalletLookupRequest): Promise<FullReport> {
  return new DefaultReportGenerator().generate(request);
}
