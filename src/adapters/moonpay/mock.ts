import { MoonPayAdapter, MoonPayFundingPlan } from "@/types/adapters";
import { SupportedChain } from "@/types/domain";

export class MockMoonPayAdapter implements MoonPayAdapter {
  async getFundingPlan(input: { walletAddress?: string; chain: SupportedChain }): Promise<MoonPayFundingPlan> {
    return {
      skillName: "moonpay-check-wallet",
      description: "Mock funding plan for demo mode. Use this before retrying the premium report unlock.",
      commands: [
        'mp wallet create --name "report-buyer"',
        `mp token balance list --wallet "report-buyer" --chain ${input.chain}`,
        `mp buy --token usdc_${input.chain} --amount 10 --wallet ${input.walletAddress ?? "<base-address>"} --email <your-email>`,
      ],
    };
  }
}
