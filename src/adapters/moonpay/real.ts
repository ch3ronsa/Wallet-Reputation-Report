import { env } from "@/config/env";
import { MoonPayAdapter, MoonPayFundingPlan } from "@/types/adapters";
import { SupportedChain } from "@/types/domain";

export class RealMoonPayAdapter implements MoonPayAdapter {
  async getFundingPlan(input: { walletAddress?: string; chain: SupportedChain }): Promise<MoonPayFundingPlan> {
    return {
      skillName: "moonpay-check-wallet",
      description: "Use MoonPay to fund the buyer wallet with Base USDC before retrying the premium route.",
      commands: [
        'mp wallet create --name "report-buyer"',
        `mp token balance list --wallet "report-buyer" --chain ${input.chain}`,
        `mp buy --token usdc_${input.chain} --amount ${env.moonpayDefaultAmount} --wallet ${input.walletAddress ?? "<base-address>"} --email <your-email>`,
        "# TODO: swap this CLI guidance for a signed MoonPay deep-link or API session once your exact MoonPay flow is chosen.",
      ],
    };
  }
}
