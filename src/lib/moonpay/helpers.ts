import { env } from "@/config/env";

export interface MoonPayFundingGuide {
  skillName: string;
  description: string;
  commands: string[];
}

export function getMoonPayFundingGuide(serviceAddress?: string): MoonPayFundingGuide {
  return {
    skillName: "moonpay-check-wallet",
    description: "Check Base USDC before retrying the premium report payment flow.",
    commands: [
      'mp wallet create --name "report-buyer"',
      'mp token balance list --wallet "report-buyer" --chain base',
      `mp buy --token usdc_base --amount ${env.moonpayDefaultAmount} --wallet ${serviceAddress ?? "<base-address>"} --email <your-email>`,
    ],
  };
}
