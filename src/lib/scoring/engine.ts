import {
  PremiumInsight,
  ScoreBand,
  ScoreSignal,
  WalletMetrics,
  WalletScore,
  WalletSnapshot,
  WalletSummary,
} from "@/types/report";

const SUSPICIOUS_KEYWORDS = ["tornado", "mixer", "drainer", "phishing", "sanction"];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function buildWalletMetrics(snapshot: WalletSnapshot): WalletMetrics {
  const txCount = snapshot.transactions.length;
  const activeDays = new Set(snapshot.transactions.map((tx) => tx.timestamp.slice(0, 10)));
  const counterparties = new Set(
    snapshot.transactions.flatMap((tx) => [tx.from, tx.to]).filter((value): value is string => Boolean(value)),
  );
  const failedTxCount = snapshot.transactions.filter((tx) => !tx.success).length;
  const totalPortfolioUsd = snapshot.balances.reduce((sum, balance) => sum + balance.usdValue, 0);
  const stablecoinUsd = snapshot.balances
    .filter((balance) => balance.isStablecoin)
    .reduce((sum, balance) => sum + balance.usdValue, 0);
  const nativeBalanceUsd = snapshot.balances
    .filter((balance) => balance.isNative)
    .reduce((sum, balance) => sum + balance.usdValue, 0);
  const largestAssetShare =
    totalPortfolioUsd > 0
      ? Math.max(...snapshot.balances.map((balance) => balance.usdValue / totalPortfolioUsd), 0)
      : 1;
  const suspiciousLabelCount = snapshot.transactions.reduce((sum, tx) => {
    const hit = tx.labels.some((label) =>
      SUSPICIOUS_KEYWORDS.some((keyword) => label.toLowerCase().includes(keyword)),
    );

    return sum + (hit ? 1 : 0);
  }, 0);

  return {
    txCount,
    uniqueActiveDays: activeDays.size,
    uniqueCounterparties: counterparties.size,
    failedTxRatio: txCount === 0 ? 1 : failedTxCount / txCount,
    stablecoinShare: totalPortfolioUsd === 0 ? 0 : stablecoinUsd / totalPortfolioUsd,
    largestAssetShare,
    totalPortfolioUsd,
    nativeBalanceUsd,
    suspiciousLabelCount,
  };
}

function bandFromScore(score: number): ScoreBand {
  if (score >= 80) {
    return "excellent";
  }

  if (score >= 65) {
    return "good";
  }

  if (score >= 45) {
    return "watch";
  }

  return "risky";
}

function addSignal(signals: ScoreSignal[], scoreRef: { value: number }, signal: ScoreSignal): void {
  scoreRef.value += signal.weight;
  signals.push(signal);
}

export function scoreWallet(metrics: WalletMetrics): WalletScore {
  const scoreRef = { value: 50 };
  const signals: ScoreSignal[] = [];

  if (metrics.txCount >= 40) {
    addSignal(signals, scoreRef, {
      id: "history-depth-strong",
      label: "Deep transaction history",
      impact: "positive",
      weight: 14,
      detail: `${metrics.txCount} transactions observed in the lookback window.`,
    });
  } else if (metrics.txCount <= 5) {
    addSignal(signals, scoreRef, {
      id: "history-depth-thin",
      label: "Thin transaction history",
      impact: "negative",
      weight: -12,
      detail: `Only ${metrics.txCount} transactions were available, which weakens trust signals.`,
    });
  }

  if (metrics.uniqueActiveDays >= 10) {
    addSignal(signals, scoreRef, {
      id: "activity-spread",
      label: "Consistent activity cadence",
      impact: "positive",
      weight: 10,
      detail: `The wallet was active across ${metrics.uniqueActiveDays} distinct days.`,
    });
  } else if (metrics.uniqueActiveDays <= 2) {
    addSignal(signals, scoreRef, {
      id: "activity-bursty",
      label: "Burst-only activity pattern",
      impact: "negative",
      weight: -8,
      detail: "Activity is concentrated into very few days.",
    });
  }

  if (metrics.uniqueCounterparties >= 12) {
    addSignal(signals, scoreRef, {
      id: "counterparty-diversity",
      label: "Healthy counterparty diversity",
      impact: "positive",
      weight: 8,
      detail: `${metrics.uniqueCounterparties} counterparties suggests broader ecosystem usage.`,
    });
  } else if (metrics.uniqueCounterparties <= 2) {
    addSignal(signals, scoreRef, {
      id: "counterparty-concentration",
      label: "Highly concentrated counterparties",
      impact: "negative",
      weight: -8,
      detail: "Most activity centers on only one or two counterparties.",
    });
  }

  if (metrics.failedTxRatio >= 0.2) {
    addSignal(signals, scoreRef, {
      id: "failed-tx-high",
      label: "High failed transaction ratio",
      impact: "negative",
      weight: -16,
      detail: `${Math.round(metrics.failedTxRatio * 100)}% of transactions appear unsuccessful.`,
    });
  } else if (metrics.failedTxRatio <= 0.05 && metrics.txCount > 0) {
    addSignal(signals, scoreRef, {
      id: "failed-tx-low",
      label: "Clean execution history",
      impact: "positive",
      weight: 6,
      detail: "The wallet shows a low failed transaction ratio.",
    });
  }

  if (metrics.stablecoinShare >= 0.2 && metrics.stablecoinShare <= 0.85) {
    addSignal(signals, scoreRef, {
      id: "stablecoin-balance",
      label: "Balanced stablecoin exposure",
      impact: "positive",
      weight: 8,
      detail: `${Math.round(metrics.stablecoinShare * 100)}% of visible holdings are stablecoins.`,
    });
  } else if (metrics.stablecoinShare === 0 && metrics.totalPortfolioUsd > 250) {
    addSignal(signals, scoreRef, {
      id: "stablecoin-zero",
      label: "No stablecoin reserves",
      impact: "neutral",
      weight: -3,
      detail: "The wallet shows no stable reserve asset in visible balances.",
    });
  }

  if (metrics.largestAssetShare >= 0.9 && metrics.totalPortfolioUsd > 100) {
    addSignal(signals, scoreRef, {
      id: "asset-concentration-high",
      label: "Extremely concentrated holdings",
      impact: "negative",
      weight: -10,
      detail: `${Math.round(metrics.largestAssetShare * 100)}% of the portfolio sits in one asset.`,
    });
  } else if (metrics.largestAssetShare <= 0.5 && metrics.totalPortfolioUsd > 100) {
    addSignal(signals, scoreRef, {
      id: "asset-concentration-balanced",
      label: "Balanced asset mix",
      impact: "positive",
      weight: 5,
      detail: "Holdings are not dominated by a single visible asset.",
    });
  }

  if (metrics.nativeBalanceUsd < 2 && metrics.txCount > 0) {
    addSignal(signals, scoreRef, {
      id: "gas-runway-low",
      label: "Low native gas runway",
      impact: "neutral",
      weight: -4,
      detail: "The wallet may have limited gas capacity for future activity.",
    });
  } else if (metrics.nativeBalanceUsd >= 10) {
    addSignal(signals, scoreRef, {
      id: "gas-runway-healthy",
      label: "Healthy native gas reserve",
      impact: "positive",
      weight: 4,
      detail: "Visible native balance suggests sustainable onchain activity.",
    });
  }

  if (metrics.suspiciousLabelCount > 0) {
    addSignal(signals, scoreRef, {
      id: "suspicious-labels",
      label: "Suspicious labels detected",
      impact: "negative",
      weight: -24,
      detail: `${metrics.suspiciousLabelCount} transaction labels matched known risk keywords.`,
    });
  }

  const score = clamp(Math.round(scoreRef.value), 0, 100);

  return {
    score,
    band: bandFromScore(score),
    signals,
  };
}

export function buildSummary(score: WalletScore, metrics: WalletMetrics): WalletSummary {
  const headlineByBand: Record<ScoreBand, string> = {
    excellent: "High-confidence wallet with strong operational history.",
    good: "Credible wallet with mostly healthy onchain patterns.",
    watch: "Mixed wallet profile that deserves review before trust-sensitive actions.",
    risky: "Elevated-risk wallet profile based on current observable behavior.",
  };

  const topSignals = [...score.signals]
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 3)
    .map((signal) => signal.detail);

  if (topSignals.length === 0) {
    topSignals.push(
      `The wallet shows ${metrics.txCount} transactions and ${metrics.totalPortfolioUsd.toFixed(2)} USD in visible holdings.`,
    );
  }

  return {
    headline: headlineByBand[score.band],
    reasons: topSignals,
  };
}

export function buildPremiumInsights(metrics: WalletMetrics, score: WalletScore): PremiumInsight[] {
  return [
    {
      title: "Underwriting posture",
      body:
        score.band === "excellent" || score.band === "good"
          ? "Suitable for higher-trust actions like allowlisting, gated access, or higher API quotas with routine monitoring."
          : "Keep this wallet in lower-trust flows until additional evidence or longer history improves the profile.",
    },
    {
      title: "Operational footprint",
      body: `The wallet touched ${metrics.uniqueCounterparties} counterparties across ${metrics.uniqueActiveDays} active days in the observed window.`,
    },
    {
      title: "Treasury quality",
      body: `Visible portfolio value is ${metrics.totalPortfolioUsd.toFixed(2)} USD with ${Math.round(
        metrics.stablecoinShare * 100,
      )}% in stablecoins.`,
    },
  ];
}
