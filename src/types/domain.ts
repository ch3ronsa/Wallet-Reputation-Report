export type SupportedChain = "base" | "ethereum";

export type SignalImpact = "positive" | "negative" | "neutral";

export type RiskLevel = "low" | "medium" | "high";

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

export interface WalletAgeSummary {
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  walletAgeDays: number | null;
}

export interface WalletActivitySummary {
  txCount: number;
  successfulTxCount: number;
  failedTxCount: number;
  uniqueActiveDays: number;
  recentTxCount7d: number;
  avgTxPerActiveDay: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
}

export interface CounterpartySummary {
  address: string;
  interactions: number;
  inboundCount: number;
  outboundCount: number;
  direction: "inbound" | "outbound" | "mixed";
  labels: string[];
}

export interface TokenConcentrationEntry {
  symbol: string;
  tokenAddress?: string;
  usdValue: number;
  share: number;
  isStablecoin: boolean;
  isNative: boolean;
}

export interface RecentActivityItem {
  hash: string;
  timestamp: string;
  type: string;
  success: boolean;
  direction: "inbound" | "outbound" | "self" | "unknown";
  counterparty?: string;
  valueUsd?: number;
  labels: string[];
}

export interface ContractInteractionSummary {
  totalContractCalls: number;
  uniqueContracts: number;
  swapCount: number;
  nftCount: number;
  transferCount: number;
  pattern: "inactive" | "transfer-heavy" | "contract-heavy" | "mixed";
}

export interface StablecoinFlowSummary {
  available: boolean;
  inboundUsd: number;
  outboundUsd: number;
  netUsd: number;
  transferCount: number;
}

export interface WalletDataQuality {
  isSparse: boolean;
  missingBalances: boolean;
  missingTransactions: boolean;
  warnings: string[];
}

export interface WalletProfile {
  address: string;
  chain: SupportedChain;
  dataSource: "mock" | "allium";
  observedAt: string;
  balances: WalletBalance[];
  transactions: WalletTransaction[];
  metrics: WalletMetrics;
  age: WalletAgeSummary;
  activity: WalletActivitySummary;
  topCounterparties: CounterpartySummary[];
  tokenConcentration: TokenConcentrationEntry[];
  recentActivity: RecentActivityItem[];
  contractInteractions: ContractInteractionSummary;
  stablecoinFlow: StablecoinFlowSummary;
  dataQuality: WalletDataQuality;
}

export interface RiskSignal {
  id: string;
  title: string;
  category:
    | "wallet-age"
    | "history-depth"
    | "token-concentration"
    | "counterparty-concentration"
    | "large-transfers"
    | "contract-interactions"
    | "activity-spike"
    | "behavior-pattern";
  impact: SignalImpact;
  weight: number;
  scoreImpact: number;
  explanation: string;
}

export interface ReputationScore {
  totalScore: number;
  riskLevel: RiskLevel;
  signals: RiskSignal[];
  summaryReasons: string[];
  uncertaintyNote: string | null;
}

export interface QuickWalletSnapshot {
  walletAgeDays: number | null;
  transactionCount: number;
  activeDays: number;
  uniqueCounterparties: number;
  visiblePortfolioUsd: number;
  recentTxCount7d: number;
  dominantAssetShare: number | null;
}

export interface FreeSummary {
  walletAddress: string;
  chain: SupportedChain;
  overallRiskLevel: RiskLevel;
  keyReasons: string[];
  quickSnapshot: QuickWalletSnapshot;
  uncertaintyNote: string | null;
}

export interface ScoreBreakdown {
  totalScore: number;
  riskLevel: RiskLevel;
  signals: RiskSignal[];
}

export interface FullReportFacts {
  notableCounterparties: CounterpartySummary[];
  concentrationObservations: string[];
  activityObservations: string[];
  limitations: string[];
}

export interface FullReportInterpretation {
  plainLanguage: string;
  trustPosture: string;
  monetizationNote: string;
}

export interface FullReport {
  walletAddress: string;
  chain: SupportedChain;
  generatedAt: string;
  freeSummary: FreeSummary;
  scoreBreakdown: ScoreBreakdown;
  facts: FullReportFacts;
  interpretation: FullReportInterpretation;
}

export interface GeneratedReportBundle {
  wallet: WalletProfile;
  score: ReputationScore;
  freeSummary: FreeSummary;
  fullReport: FullReport;
  generatedAt: string;
}
