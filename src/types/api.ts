import { FreeSummary, FullReport, SupportedChain } from "@/types/domain";

export interface WalletLookupRequest {
  address: string;
  chain: SupportedChain;
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

export type PaymentState = "locked" | "pending" | "paid" | "failed";

export interface UnlockSession {
  sessionId: string;
  state: PaymentState;
  requirements: X402PaymentRequirement[];
  checkoutUrl?: string;
  verifyAfterMs?: number;
  ctaLabel: string;
  message: string;
  unlockToken?: string;
  failureReason?: string;
}

export interface FreeReportResponse {
  mode: "mock" | "real";
  report?: FreeSummary;
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
  paymentState?: PaymentState;
  error?: string;
}

export interface UnlockReportRequest extends WalletLookupRequest {
  sessionId?: string;
}

export interface UnlockReportResponse {
  mode: "mock" | "real";
  session?: UnlockSession;
  error?: string;
}
