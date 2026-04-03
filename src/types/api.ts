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

export interface OwsServiceIdentityResponse {
  walletName: string;
  address: string;
  chain: SupportedChain;
}

export interface OwsCliWorkflowResponse {
  setupCommands: string[];
  unlockCommands: string[];
  note: string;
}

export interface MoonPayTopUpResponse {
  available: boolean;
  skillName: string;
  description: string;
  targetWalletAddress?: string;
  targetAsset?: string;
  suggestedAmount?: number;
  fallbackMessage?: string;
  commands: string[];
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
  owsService?: OwsServiceIdentityResponse;
  owsWorkflow?: OwsCliWorkflowResponse;
  moonpay?: MoonPayTopUpResponse;
  paymentState?: PaymentState;
  error?: string;
}

export interface UnlockReportRequest extends WalletLookupRequest {
  sessionId?: string;
}

export interface UnlockReportResponse {
  mode: "mock" | "real";
  session?: UnlockSession;
  owsService?: OwsServiceIdentityResponse;
  owsWorkflow?: OwsCliWorkflowResponse;
  moonpay?: MoonPayTopUpResponse;
  error?: string;
}
