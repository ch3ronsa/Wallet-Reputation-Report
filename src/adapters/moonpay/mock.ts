import { MoonPayAdapter, MoonPayFundingPlan } from "@/types/adapters";
import { SupportedChain } from "@/types/domain";

export class MockMoonPayAdapter implements MoonPayAdapter {
  async getFundingPlan(input: { walletAddress?: string; chain: SupportedChain }): Promise<MoonPayFundingPlan> {
    return {
      available: true,
      skillName: "moonpay-buy-crypto",
      description: "Top up the OWS buyer wallet before retrying the premium report unlock.",
      targetWalletName: "report-buyer",
      targetWalletAddress: input.walletAddress,
      targetAsset: `USDC on ${input.chain}`,
      suggestedAmount: 10,
      commands: [
        'mp wallet create --name "report-buyer"',
        `mp token balance list --wallet "report-buyer" --chain ${input.chain}`,
        `mp buy --token usdc_${input.chain} --amount 10 --wallet ${input.walletAddress ?? "<base-address>"} --email <your-email>`,
      ],
      fallbackMessage: "If MoonPay skill execution is unavailable locally, fund the OWS buyer wallet manually and retry verification.",
    };
  }
}
