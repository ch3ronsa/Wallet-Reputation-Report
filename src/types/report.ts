export type SupportedChain = "base" | "ethereum";

export type ScoreBand = "excellent" | "good" | "watch" | "risky";

export type SignalImpact = "positive" | "negative" | "neutral";

export interface WalletReportRequest {
  address: string;
  chain: SupportedChain;
}

export interface WalletTransaction {
  hash: string;
  timestamp: string;
  success: boolean;
  from?: string;
  to?: string;
  type?: string;
  feeUsd?: number;
  valueUsd?: number;
  labels: string[];
}

export interface WalletBalance {
  symbol: string;
  tokenAddress?: string;
  amount: number;
  usdValue: number;
  isStablecoin: boolean;
  isNative: boolean;
}

export interface WalletSnapshot {
  chain: SupportedChain;
  address: string;
  transactions: WalletTransaction[];
  balances: WalletBalance[];
}

export interface WalletMetrics {
  txCount: number;
  uniqueActiveDays: number;
  uniqueCounterparties: number;
  failedTxRatio: number;
  stablecoinShare: number;
  largestAssetShare: number;
  totalPortfolioUsd: number;
  nativeBalanceUsd: number;
  suspiciousLabelCount: number;
}

export interface ScoreSignal {
  id: string;
  label: string;
  impact: SignalImpact;
  weight: number;
  detail: string;
}

export interface WalletScore {
  score: number;
  band: ScoreBand;
  signals: ScoreSignal[];
}

export interface WalletSummary {
  headline: string;
  reasons: string[];
}

export interface PremiumInsight {
  title: string;
  body: string;
}

export interface WalletReport {
  request: WalletReportRequest;
  metrics: WalletMetrics;
  score: WalletScore;
  summary: WalletSummary;
  premiumInsights: PremiumInsight[];
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

export interface PremiumAccessResult {
  paid: boolean;
  requirements?: X402PaymentRequirement[];
}
