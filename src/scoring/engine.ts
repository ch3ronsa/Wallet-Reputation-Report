import {
  PremiumInsight,
  ReputationBand,
  ReputationScore,
  ReportSummary,
  RiskSignal,
  WalletBalance,
  WalletMetrics,
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

function bandFromValue(value: number): ReputationBand {
  if (value >= 80) {
    return "excellent";
  }

  if (value >= 65) {
    return "good";
  }

  if (value >= 45) {
    return "watch";
  }

  return "risky";
}

function addSignal(target: RiskSignal[], accumulator: { value: number }, signal: RiskSignal): void {
  accumulator.value += signal.weight;
  target.push(signal);
}

export function scoreWallet(metrics: WalletMetrics): ReputationScore {
  const accumulator = { value: 50 };
  const signals: RiskSignal[] = [];

  if (metrics.txCount >= 40) {
    addSignal(signals, accumulator, {
      id: "history-depth-strong",
      title: "Deep transaction history",
      impact: "positive",
      weight: 14,
      explanation: `${metrics.txCount} transactions were detected in the lookback window.`,
    });
  } else if (metrics.txCount <= 5) {
    addSignal(signals, accumulator, {
      id: "history-depth-thin",
      title: "Thin transaction history",
      impact: "negative",
      weight: -12,
      explanation: `Only ${metrics.txCount} transactions were available for analysis.`,
    });
  }

  if (metrics.uniqueActiveDays >= 10) {
    addSignal(signals, accumulator, {
      id: "cadence-healthy",
      title: "Consistent onchain cadence",
      impact: "positive",
      weight: 10,
      explanation: `Activity spans ${metrics.uniqueActiveDays} distinct days.`,
    });
  } else if (metrics.uniqueActiveDays <= 2) {
    addSignal(signals, accumulator, {
      id: "cadence-bursty",
      title: "Burst-only activity pattern",
      impact: "negative",
      weight: -8,
      explanation: "Activity is concentrated into very few days.",
    });
  }

  if (metrics.uniqueCounterparties >= 12) {
    addSignal(signals, accumulator, {
      id: "counterparty-diversity",
      title: "Healthy counterparty diversity",
      impact: "positive",
      weight: 8,
      explanation: `${metrics.uniqueCounterparties} counterparties suggests broader network usage.`,
    });
  } else if (metrics.uniqueCounterparties <= 2) {
    addSignal(signals, accumulator, {
      id: "counterparty-concentration",
      title: "Counterparty concentration",
      impact: "negative",
      weight: -8,
      explanation: "Most activity centers on only one or two counterparties.",
    });
  }

  if (metrics.failedTxRatio >= 0.2) {
    addSignal(signals, accumulator, {
      id: "failed-ratio-high",
      title: "High failed transaction ratio",
      impact: "negative",
      weight: -16,
      explanation: `${Math.round(metrics.failedTxRatio * 100)}% of visible transactions appear unsuccessful.`,
    });
  } else if (metrics.failedTxRatio <= 0.05 && metrics.txCount > 0) {
    addSignal(signals, accumulator, {
      id: "failed-ratio-low",
      title: "Clean execution history",
      impact: "positive",
      weight: 6,
      explanation: "The wallet shows a low failed transaction ratio.",
    });
  }

  if (metrics.stablecoinShare >= 0.2 && metrics.stablecoinShare <= 0.85) {
    addSignal(signals, accumulator, {
      id: "stable-balance",
      title: "Balanced stablecoin exposure",
      impact: "positive",
      weight: 8,
      explanation: `${Math.round(metrics.stablecoinShare * 100)}% of holdings are in stablecoins.`,
    });
  } else if (metrics.stablecoinShare === 0 && metrics.totalPortfolioUsd > 250) {
    addSignal(signals, accumulator, {
      id: "stable-none",
      title: "No stable reserve visible",
      impact: "neutral",
      weight: -3,
      explanation: "The visible portfolio does not include a stable reserve asset.",
    });
  }

  if (metrics.largestAssetShare >= 0.9 && metrics.totalPortfolioUsd > 100) {
    addSignal(signals, accumulator, {
      id: "asset-concentration-high",
      title: "Extreme asset concentration",
      impact: "negative",
      weight: -10,
      explanation: `${Math.round(metrics.largestAssetShare * 100)}% of the visible portfolio sits in one asset.`,
    });
  } else if (metrics.largestAssetShare <= 0.5 && metrics.totalPortfolioUsd > 100) {
    addSignal(signals, accumulator, {
      id: "asset-concentration-balanced",
      title: "Balanced visible holdings",
      impact: "positive",
      weight: 5,
      explanation: "No single visible asset dominates the portfolio.",
    });
  }

  if (metrics.nativeBalanceUsd < 2 && metrics.txCount > 0) {
    addSignal(signals, accumulator, {
      id: "gas-runway-low",
      title: "Low native gas runway",
      impact: "neutral",
      weight: -4,
      explanation: "The wallet may have limited gas capacity for future activity.",
    });
  } else if (metrics.nativeBalanceUsd >= 10) {
    addSignal(signals, accumulator, {
      id: "gas-runway-healthy",
      title: "Healthy native gas reserve",
      impact: "positive",
      weight: 4,
      explanation: "Visible native balance suggests sustainable activity.",
    });
  }

  if (metrics.suspiciousLabelCount > 0) {
    addSignal(signals, accumulator, {
      id: "suspicious-labels",
      title: "Suspicious labels detected",
      impact: "negative",
      weight: -24,
      explanation: `${metrics.suspiciousLabelCount} labels matched known high-risk keywords.`,
    });
  }

  const value = clamp(Math.round(accumulator.value), 0, 100);

  return {
    value,
    band: bandFromValue(value),
    signals,
  };
}

export function buildReportSummary(score: ReputationScore, metrics: WalletMetrics): ReportSummary {
  const headlineByBand: Record<ReputationBand, string> = {
    excellent: "High-confidence wallet profile",
    good: "Healthy wallet profile",
    watch: "Mixed wallet profile",
    risky: "Elevated-risk wallet profile",
  };

  const verdictByBand: Record<ReputationBand, string> = {
    excellent: "Suitable for higher-trust flows with routine monitoring.",
    good: "Reasonably trustworthy, but still worth monitoring over time.",
    watch: "Requires manual review for sensitive or monetized workflows.",
    risky: "Should remain in restricted or low-trust flows until more evidence appears.",
  };

  const bullets = [...score.signals]
    .sort((left, right) => Math.abs(right.weight) - Math.abs(left.weight))
    .slice(0, 3)
    .map((signal) => signal.explanation);

  if (bullets.length === 0) {
    bullets.push(
      `Observed ${metrics.txCount} transactions and ${metrics.totalPortfolioUsd.toFixed(2)} USD in visible balances.`,
    );
  }

  return {
    headline: headlineByBand[score.band],
    verdict: verdictByBand[score.band],
    bullets,
  };
}

export function buildPremiumInsights(metrics: WalletMetrics, score: ReputationScore): PremiumInsight[] {
  return [
    {
      title: "Trust recommendation",
      body:
        score.band === "excellent" || score.band === "good"
          ? "Candidate for higher API limits, allowlists, or priority treatment with periodic reevaluation."
          : "Keep the wallet in lower-trust flows until its operating history becomes stronger.",
    },
    {
      title: "Operational footprint",
      body: `Observed ${metrics.uniqueCounterparties} counterparties across ${metrics.uniqueActiveDays} active days.`,
    },
    {
      title: "Treasury posture",
      body: `Visible portfolio value is ${metrics.totalPortfolioUsd.toFixed(2)} USD with ${Math.round(
        metrics.stablecoinShare * 100,
      )}% stablecoin exposure.`,
    },
  ];
}
