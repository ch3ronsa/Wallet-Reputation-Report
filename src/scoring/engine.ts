import { SCORE_BASE, SCORE_THRESHOLDS, SIGNAL_WEIGHTS } from "@/scoring/model";
import {
  PremiumInsight,
  ReportSummary,
  ReputationScore,
  RiskLevel,
  RiskSignal,
  WalletBalance,
  WalletMetrics,
  WalletProfile,
  WalletTransaction,
} from "@/types/domain";

const SUSPICIOUS_KEYWORDS = ["tornado", "mixer", "drainer", "phishing", "sanction"];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function buildWalletMetrics(input: {
  balances: WalletBalance[];
  transactions: WalletTransaction[];
}): WalletMetrics {
  const txCount = input.transactions.length;
  const activeDays = new Set(input.transactions.map((tx) => tx.timestamp.slice(0, 10)));
  const counterparties = new Set(
    input.transactions.flatMap((tx) => [tx.from, tx.to]).filter((value): value is string => Boolean(value)),
  );
  const failedTxCount = input.transactions.filter((tx) => !tx.success).length;
  const totalPortfolioUsd = input.balances.reduce((sum, balance) => sum + balance.usdValue, 0);
  const stablecoinUsd = input.balances
    .filter((balance) => balance.isStablecoin)
    .reduce((sum, balance) => sum + balance.usdValue, 0);
  const nativeBalanceUsd = input.balances
    .filter((balance) => balance.isNative)
    .reduce((sum, balance) => sum + balance.usdValue, 0);
  const largestAssetShare =
    totalPortfolioUsd > 0 ? Math.max(...input.balances.map((item) => item.usdValue / totalPortfolioUsd), 0) : 1;
  const suspiciousLabelCount = input.transactions.reduce((count, transaction) => {
    const hasSuspiciousLabel = transaction.labels.some((label) =>
      SUSPICIOUS_KEYWORDS.some((keyword) => label.toLowerCase().includes(keyword)),
    );

    return count + (hasSuspiciousLabel ? 1 : 0);
  }, 0);

  return {
    txCount,
    uniqueActiveDays: activeDays.size,
    uniqueCounterparties: counterparties.size,
    failedTxRatio: txCount === 0 ? 0 : failedTxCount / txCount,
    stablecoinShare: totalPortfolioUsd === 0 ? 0 : stablecoinUsd / totalPortfolioUsd,
    largestAssetShare,
    totalPortfolioUsd,
    nativeBalanceUsd,
    suspiciousLabelCount,
  };
}

function resolveRiskLevel(totalScore: number): RiskLevel {
  if (totalScore >= SCORE_THRESHOLDS.low.min) {
    return "low";
  }

  if (totalScore >= SCORE_THRESHOLDS.medium.min) {
    return "medium";
  }

  return "high";
}

function makeSignal(input: Omit<RiskSignal, "impact" | "scoreImpact"> & { positive?: boolean }): RiskSignal {
  return {
    ...input,
    impact: input.positive ? "positive" : "negative",
    scoreImpact: -Math.abs(input.weight),
  };
}

function detectVeryNewWallet(wallet: WalletProfile): RiskSignal | null {
  const ageDays = wallet.age.walletAgeDays;

  if (ageDays === null || ageDays > 14) {
    return null;
  }

  return makeSignal({
    id: "very-new-wallet",
    title: "Very new wallet",
    category: "wallet-age",
    weight: SIGNAL_WEIGHTS.veryNewWallet,
    explanation: `The wallet only shows about ${ageDays} days of observable history, which limits confidence and raises fresh-wallet risk.`,
  });
}

function detectVeryLowActivity(wallet: WalletProfile): RiskSignal | null {
  if (wallet.activity.txCount > 5 && wallet.activity.uniqueActiveDays > 2) {
    return null;
  }

  return makeSignal({
    id: "very-low-activity-history",
    title: "Very low activity history",
    category: "history-depth",
    weight: SIGNAL_WEIGHTS.veryLowHistory,
    explanation: `Only ${wallet.activity.txCount} transactions across ${wallet.activity.uniqueActiveDays} active days were available for scoring.`,
  });
}

function detectHighTokenConcentration(wallet: WalletProfile): RiskSignal | null {
  if (wallet.metrics.totalPortfolioUsd <= 100 || wallet.metrics.largestAssetShare < 0.85) {
    return null;
  }

  const topToken = wallet.tokenConcentration[0];
  const topLabel = topToken ? topToken.symbol : "one asset";

  return makeSignal({
    id: "high-token-concentration",
    title: "High token concentration",
    category: "token-concentration",
    weight: SIGNAL_WEIGHTS.highTokenConcentration,
    explanation: `${Math.round(wallet.metrics.largestAssetShare * 100)}% of visible holdings sit in ${topLabel}, which increases concentration risk.`,
  });
}

function detectHighCounterpartyConcentration(wallet: WalletProfile): RiskSignal | null {
  const leader = wallet.topCounterparties[0];

  if (!leader || wallet.activity.txCount < 4) {
    return null;
  }

  const share = leader.interactions / wallet.activity.txCount;

  if (share < 0.6) {
    return null;
  }

  return makeSignal({
    id: "high-counterparty-concentration",
    title: "High counterparty concentration",
    category: "counterparty-concentration",
    weight: SIGNAL_WEIGHTS.highCounterpartyConcentration,
    explanation: `${Math.round(share * 100)}% of observed activity centers on a single counterparty, suggesting concentrated behavior.`,
  });
}

function detectUnusualLargeTransfers(wallet: WalletProfile): RiskSignal | null {
  if (wallet.metrics.totalPortfolioUsd <= 0) {
    return null;
  }

  const largeTransfers = wallet.transactions.filter((transaction) => (transaction.valueUsd ?? 0) >= wallet.metrics.totalPortfolioUsd * 0.75);

  if (largeTransfers.length === 0) {
    return null;
  }

  return makeSignal({
    id: "unusual-large-transfers",
    title: "Unusual large transfers",
    category: "large-transfers",
    weight: SIGNAL_WEIGHTS.unusualLargeTransfers,
    explanation: `${largeTransfers.length} transfer(s) were large relative to the visible wallet balance, which can indicate volatile treasury behavior.`,
  });
}

function detectUnknownContractInteraction(wallet: WalletProfile): RiskSignal | null {
  const unknownContracts = wallet.recentActivity.filter(
    (activity) => activity.type === "unknown" || activity.labels.length === 0,
  ).length;

  if (wallet.contractInteractions.totalContractCalls < 3 || unknownContracts < 2) {
    return null;
  }

  return makeSignal({
    id: "frequent-unknown-contract-interaction",
    title: "Frequent unknown contract interaction",
    category: "contract-interactions",
    weight: SIGNAL_WEIGHTS.frequentUnknownContractInteraction,
    explanation: `${unknownContracts} recent contract interactions had weak labeling, which reduces explainability around wallet behavior.`,
  });
}

function detectRecentSuddenSpike(wallet: WalletProfile): RiskSignal | null {
  if (wallet.activity.uniqueActiveDays < 2 || wallet.activity.recentTxCount7d < 4) {
    return null;
  }

  const olderTxCount = wallet.activity.txCount - wallet.activity.recentTxCount7d;
  const olderDays = Math.max(wallet.activity.uniqueActiveDays - 7, 1);
  const olderAverage = olderTxCount > 0 ? olderTxCount / olderDays : 0;

  if (wallet.activity.recentTxCount7d < olderAverage * 3 || wallet.activity.recentTxCount7d < 6) {
    return null;
  }

  return makeSignal({
    id: "recent-sudden-activity-spike",
    title: "Recent sudden activity spike",
    category: "activity-spike",
    weight: SIGNAL_WEIGHTS.recentSuddenActivitySpike,
    explanation: `Recent activity is materially higher than the wallet's older cadence, which can indicate a sudden behavioral change.`,
  });
}

function detectNarrowBehaviorPattern(wallet: WalletProfile): RiskSignal | null {
  const transferHeavy = wallet.contractInteractions.pattern === "transfer-heavy";
  const contractHeavy = wallet.contractInteractions.pattern === "contract-heavy";
  const stableFlowCount = wallet.stablecoinFlow.transferCount;

  if (!transferHeavy && !contractHeavy && wallet.topCounterparties.length > 2) {
    return null;
  }

  const patternLabel = transferHeavy
    ? "mostly simple transfers"
    : contractHeavy
      ? "mostly one-sided contract interactions"
      : "a very narrow set of behaviors";

  return makeSignal({
    id: "suspiciously-narrow-behavior-pattern",
    title: "Suspiciously narrow behavior pattern",
    category: "behavior-pattern",
    weight: SIGNAL_WEIGHTS.suspiciouslyNarrowBehaviorPattern,
    explanation: `The wallet shows ${patternLabel}${stableFlowCount > 0 ? " with limited behavioral diversity beyond stablecoin flow" : ""}.`,
  });
}

export function scoreWallet(wallet: WalletProfile): ReputationScore {
  const candidateSignals = [
    detectVeryNewWallet(wallet),
    detectVeryLowActivity(wallet),
    detectHighTokenConcentration(wallet),
    detectHighCounterpartyConcentration(wallet),
    detectUnusualLargeTransfers(wallet),
    detectUnknownContractInteraction(wallet),
    detectRecentSuddenSpike(wallet),
    detectNarrowBehaviorPattern(wallet),
  ].filter((signal): signal is RiskSignal => Boolean(signal));

  const totalPenalty = candidateSignals.reduce((sum, signal) => sum + Math.abs(signal.weight), 0);
  const totalScore = clamp(SCORE_BASE - totalPenalty, 0, 100);
  const summaryReasons = [...candidateSignals]
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 3)
    .map((signal) => signal.explanation);
  const uncertaintyNote = wallet.dataQuality.isSparse
    ? `Confidence is limited because ${wallet.dataQuality.warnings.join(" ")}`
    : null;

  return {
    totalScore,
    riskLevel: resolveRiskLevel(totalScore),
    signals: candidateSignals,
    summaryReasons:
      summaryReasons.length > 0
        ? summaryReasons
        : ["No major deterministic risk signals fired from the currently available wallet data."],
    uncertaintyNote,
  };
}

export function buildReportSummary(score: ReputationScore, wallet: WalletProfile): ReportSummary {
  const headlineByRiskLevel: Record<RiskLevel, string> = {
    low: "Low-risk wallet profile",
    medium: "Medium-risk wallet profile",
    high: "High-risk wallet profile",
  };

  const verdictByRiskLevel: Record<RiskLevel, string> = {
    low: "The wallet looks relatively stable based on the currently observable deterministic signals.",
    medium: "The wallet shows mixed indicators and should be reviewed before trust-sensitive use cases.",
    high: "The wallet triggers multiple risk signals and should stay in lower-trust flows.",
  };

  return {
    headline: headlineByRiskLevel[score.riskLevel],
    verdict: `${verdictByRiskLevel[score.riskLevel]} Score: ${score.totalScore}/100.`,
    bullets: score.summaryReasons,
    uncertaintyNote: score.uncertaintyNote,
  };
}

export function buildPremiumInsights(wallet: WalletProfile, score: ReputationScore): PremiumInsight[] {
  return [
    {
      title: "Risk posture",
      body:
        score.riskLevel === "low"
          ? "Suitable for higher-trust flows with monitoring."
          : score.riskLevel === "medium"
            ? "Use for monitored or rate-limited flows until history deepens."
            : "Keep in restricted flows until behavior broadens and history strengthens.",
    },
    {
      title: "Behavior pattern",
      body: `Observed pattern is ${wallet.contractInteractions.pattern} with ${wallet.contractInteractions.totalContractCalls} contract-oriented interactions.`,
    },
    {
      title: "Data confidence",
      body: score.uncertaintyNote ?? "Current wallet data appears sufficient for a basic deterministic read.",
    },
  ];
}
