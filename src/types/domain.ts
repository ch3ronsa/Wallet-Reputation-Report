export type SupportedChain = "base" | "ethereum";

export type SignalImpact = "positive" | "negative" | "neutral";

export type ReputationBand = "excellent" | "good" | "watch" | "risky";

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

export interface WalletProfile {
  address: string;
  chain: SupportedChain;
  dataSource: "mock" | "allium";
  observedAt: string;
  balances: WalletBalance[];
  transactions: WalletTransaction[];
  metrics: WalletMetrics;
}

export interface RiskSignal {
  id: string;
  title: string;
  impact: SignalImpact;
  weight: number;
  explanation: string;
}

export interface ReputationScore {
  value: number;
  band: ReputationBand;
  signals: RiskSignal[];
}

export interface ReportSummary {
  headline: string;
  verdict: string;
  bullets: string[];
}

export interface PremiumInsight {
  title: string;
  body: string;
}

export interface FullReport {
  wallet: WalletProfile;
  score: ReputationScore;
  summary: ReportSummary;
  premiumInsights: PremiumInsight[];
  generatedAt: string;
}
