import { env } from "@/config/env";
import { MoonPayAdapter, MoonPayFundingPlan } from "@/types/adapters";
import { SupportedChain } from "@/types/domain";

export class RealMoonPayAdapter implements MoonPayAdapter {
  async getFundingPlan(input: { walletAddress?: string; chain: SupportedChain }): Promise<MoonPayFundingPlan> {
    if (!env.moonPayEnabled) {
      return {
        available: false,
        skillName: "moonpay-buy-crypto",
        description: "MoonPay top-up is disabled in this environment.",
        targetWalletName: "report-buyer",
        targetWalletAddress: input.walletAddress,
        targetAsset: `USDC on ${input.chain}`,
        suggestedAmount: env.moonpayDefaultAmount,
        fallbackMessage: "Use the OWS CLI funding path or manually fund the buyer wallet with Base USDC, then retry the unlock.",
        commands: [
          'ows wallet create --name "report-buyer"',
          `ows fund deposit --wallet "report-buyer" --chain ${input.chain} --token USDC`,
        ],
      };
    }

    return {
      available: true,
      skillName: "moonpay-buy-crypto",
      description: "Use MoonPay to top up the OWS buyer wallet with enough USDC to unlock the full report.",
      targetWalletName: "report-buyer",
      targetWalletAddress: input.walletAddress,
      targetAsset: `USDC on ${input.chain}`,
      suggestedAmount: env.moonpayDefaultAmount,
      commands: [
        'mp wallet create --name "report-buyer"',
        `mp token balance list --wallet "report-buyer" --chain ${input.chain}`,
        `mp buy --token usdc_${input.chain} --amount ${env.moonpayDefaultAmount} --wallet ${input.walletAddress ?? "<base-address>"} --email <your-email>`,
        "# TODO: swap this CLI guidance for a signed MoonPay deep-link or API session once your exact MoonPay flow is chosen.",
      ],
      fallbackMessage: "If MoonPay is unavailable in local dev, fund the OWS buyer wallet manually, then verify payment again.",
    };
  }
}
