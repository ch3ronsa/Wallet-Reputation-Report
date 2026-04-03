import { FullReport, ReportSummary, ReputationScore, SupportedChain, WalletProfile } from "@/types/domain";

export interface WalletLookupRequest {
  address: string;
  chain: SupportedChain;
}

export interface FreeReportPayload {
  wallet: WalletProfile;
  summary: ReportSummary;
  score: ReputationScore;
  generatedAt: string;
}

export interface X402PaymentRequirement {
  scheme: "exact";
  network: SupportedChain;
  asset: string;
  maxAmountRequired: string;
  receiver: string;
  description: string;
  resource: string;
}

export interface FreeReportResponse {
  mode: "mock" | "real";
  report?: FreeReportPayload;
  error?: string;
}

export interface FullReportResponse {
  mode: "mock" | "real";
  report?: FullReport;
  requirements?: X402PaymentRequirement[];
  owsCommands?: string[];
  moonpay?: {
    skillName: string;
    description: string;
    commands: string[];
  };
  error?: string;
}
