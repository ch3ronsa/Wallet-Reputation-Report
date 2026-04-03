import {
  ContractInteractionSummary,
  CounterpartySummary,
  RecentActivityItem,
  StablecoinFlowSummary,
  TokenConcentrationEntry,
  WalletAgeSummary,
  WalletActivitySummary,
  WalletBalance,
  WalletDataQuality,
  WalletMetrics,
  WalletProfile,
  WalletTransaction,
} from "@/types/domain";
import { WalletLookupRequest } from "@/types/api";
import { buildWalletMetrics } from "@/scoring/engine";

function toTime(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function daysBetween(from: string, to: string): number | null {
  const fromTime = toTime(from);
  const toTimeValue = toTime(to);

  if (!fromTime || !toTimeValue || toTimeValue < fromTime) {
    return null;
  }

  return Math.max(0, Math.floor((toTimeValue - fromTime) / 86_400_000));
}

function summarizeAge(transactions: WalletTransaction[]): WalletAgeSummary {
  if (transactions.length === 0) {
    return {
      firstSeenAt: null,
      lastSeenAt: null,
      walletAgeDays: null,
    };
  }

  const ordered = [...transactions].sort((left, right) => toTime(left.timestamp) - toTime(right.timestamp));
  const firstSeenAt = ordered[0]?.timestamp ?? null;
  const lastSeenAt = ordered.at(-1)?.timestamp ?? null;

  return {
    firstSeenAt,
    lastSeenAt,
    walletAgeDays: firstSeenAt && lastSeenAt ? daysBetween(firstSeenAt, lastSeenAt) : null,
  };
}

function summarizeActivity(transactions: WalletTransaction[]): WalletActivitySummary {
  const age = summarizeAge(transactions);
  const successfulTxCount = transactions.filter((transaction) => transaction.success).length;
  const failedTxCount = transactions.length - successfulTxCount;
  const uniqueDays = new Set(transactions.map((transaction) => transaction.timestamp.slice(0, 10))).size;
  const lastSevenDaysStart = Date.now() - 7 * 86_400_000;
  const recentTxCount7d = transactions.filter((transaction) => toTime(transaction.timestamp) >= lastSevenDaysStart).length;

  return {
    txCount: transactions.length,
    successfulTxCount,
    failedTxCount,
    uniqueActiveDays: uniqueDays,
    recentTxCount7d,
    avgTxPerActiveDay: uniqueDays > 0 ? Number((transactions.length / uniqueDays).toFixed(2)) : 0,
    firstSeenAt: age.firstSeenAt,
    lastSeenAt: age.lastSeenAt,
  };
}

function summarizeCounterparties(transactions: WalletTransaction[], address: string): CounterpartySummary[] {
  const normalizedAddress = address.toLowerCase();
  const byCounterparty = new Map<string, CounterpartySummary>();

  for (const transaction of transactions) {
    const from = transaction.from?.toLowerCase();
    const to = transaction.to?.toLowerCase();
    const counterparty = from === normalizedAddress ? transaction.to : to === normalizedAddress ? transaction.from : undefined;

    if (!counterparty) {
      continue;
    }

    const existing = byCounterparty.get(counterparty) ?? {
      address: counterparty,
      interactions: 0,
      inboundCount: 0,
      outboundCount: 0,
      direction: "mixed" as const,
      labels: [],
    };

    existing.interactions += 1;

    if (to === normalizedAddress) {
      existing.inboundCount += 1;
    } else if (from === normalizedAddress) {
      existing.outboundCount += 1;
    }

    existing.labels = Array.from(new Set([...existing.labels, ...transaction.labels]));
    existing.direction =
      existing.inboundCount > 0 && existing.outboundCount > 0
        ? "mixed"
        : existing.inboundCount > 0
          ? "inbound"
          : "outbound";

    byCounterparty.set(counterparty, existing);
  }

  return [...byCounterparty.values()].sort((left, right) => right.interactions - left.interactions).slice(0, 5);
}

function summarizeTokenConcentration(balances: WalletBalance[]): TokenConcentrationEntry[] {
  const totalPortfolioUsd = balances.reduce((sum, balance) => sum + balance.usdValue, 0);

  return [...balances]
    .sort((left, right) => right.usdValue - left.usdValue)
    .slice(0, 5)
    .map((balance) => ({
      symbol: balance.symbol,
      tokenAddress: balance.tokenAddress,
      usdValue: balance.usdValue,
      share: totalPortfolioUsd > 0 ? balance.usdValue / totalPortfolioUsd : 0,
      isStablecoin: balance.isStablecoin,
      isNative: balance.isNative,
    }));
}

function buildRecentActivity(transactions: WalletTransaction[], address: string): RecentActivityItem[] {
  const normalizedAddress = address.toLowerCase();

  return [...transactions]
    .sort((left, right) => toTime(right.timestamp) - toTime(left.timestamp))
    .slice(0, 5)
    .map((transaction) => {
      const from = transaction.from?.toLowerCase();
      const to = transaction.to?.toLowerCase();
      const direction =
        from === normalizedAddress && to === normalizedAddress
          ? "self"
          : from === normalizedAddress
            ? "outbound"
            : to === normalizedAddress
              ? "inbound"
              : "unknown";
      const counterparty = direction === "outbound" ? transaction.to : direction === "inbound" ? transaction.from : undefined;

      return {
        hash: transaction.hash,
        timestamp: transaction.timestamp,
        type: transaction.type ?? "unknown",
        success: transaction.success,
        direction,
        counterparty,
        valueUsd: transaction.valueUsd,
        labels: transaction.labels,
      };
    });
}

function summarizeContractInteractions(transactions: WalletTransaction[]): ContractInteractionSummary {
  const contractCalls = transactions.filter((transaction) => {
    const type = (transaction.type ?? "").toLowerCase();
    return type.includes("contract") || type.includes("swap") || type.includes("mint");
  });
  const uniqueContracts = new Set(contractCalls.map((transaction) => transaction.to?.toLowerCase()).filter(Boolean)).size;
  const swapCount = transactions.filter((transaction) => (transaction.type ?? "").toLowerCase().includes("swap")).length;
  const nftCount = transactions.filter((transaction) => {
    const type = (transaction.type ?? "").toLowerCase();
    return type.includes("nft") || type.includes("mint");
  }).length;
  const transferCount = transactions.filter((transaction) => (transaction.type ?? "").toLowerCase().includes("transfer")).length;

  let pattern: ContractInteractionSummary["pattern"] = "inactive";

  if (transactions.length > 0) {
    if (contractCalls.length === 0 && transferCount > 0) {
      pattern = "transfer-heavy";
    } else if (contractCalls.length >= Math.max(1, transferCount)) {
      pattern = "contract-heavy";
    } else {
      pattern = "mixed";
    }
  }

  return {
    totalContractCalls: contractCalls.length,
    uniqueContracts,
    swapCount,
    nftCount,
    transferCount,
    pattern,
  };
}

function summarizeStablecoinFlow(transactions: WalletTransaction[], address: string): StablecoinFlowSummary {
  const normalizedAddress = address.toLowerCase();
  let inboundUsd = 0;
  let outboundUsd = 0;
  let transferCount = 0;

  for (const transaction of transactions) {
    const labels = transaction.labels.map((label) => label.toLowerCase());
    const maybeStablecoin = labels.some((label) => label.includes("stable")) || (transaction.type ?? "").toLowerCase().includes("stable");

    if (!maybeStablecoin) {
      continue;
    }

    transferCount += 1;
    const valueUsd = transaction.valueUsd ?? 0;

    if (transaction.to?.toLowerCase() === normalizedAddress) {
      inboundUsd += valueUsd;
    }

    if (transaction.from?.toLowerCase() === normalizedAddress) {
      outboundUsd += valueUsd;
    }
  }

  return {
    available: transferCount > 0,
    inboundUsd,
    outboundUsd,
    netUsd: inboundUsd - outboundUsd,
    transferCount,
  };
}

function summarizeDataQuality(input: {
  balances: WalletBalance[];
  transactions: WalletTransaction[];
  metrics: WalletMetrics;
}): WalletDataQuality {
  const warnings: string[] = [];

  if (input.transactions.length === 0) {
    warnings.push("No transactions were returned by Allium; wallet age and behavior signals are limited.");
  }

  if (input.balances.length === 0) {
    warnings.push("No balances were returned by Allium; token concentration and treasury signals are limited.");
  }

  if (input.metrics.txCount > 0 && input.metrics.uniqueActiveDays <= 1) {
    warnings.push("Activity is concentrated in a very small observation window.");
  }

  return {
    isSparse: input.transactions.length < 3 || input.balances.length === 0,
    missingBalances: input.balances.length === 0,
    missingTransactions: input.transactions.length === 0,
    warnings,
  };
}

export function normalizeWalletProfile(input: {
  request: WalletLookupRequest;
  dataSource: "mock" | "allium";
  balances: WalletBalance[];
  transactions: WalletTransaction[];
  observedAt?: string;
}): WalletProfile {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const metrics = buildWalletMetrics({
    balances: input.balances,
    transactions: input.transactions,
  });

  return {
    address: input.request.address,
    chain: input.request.chain,
    dataSource: input.dataSource,
    observedAt,
    balances: input.balances,
    transactions: input.transactions,
    metrics,
    age: summarizeAge(input.transactions),
    activity: summarizeActivity(input.transactions),
    topCounterparties: summarizeCounterparties(input.transactions, input.request.address),
    tokenConcentration: summarizeTokenConcentration(input.balances),
    recentActivity: buildRecentActivity(input.transactions, input.request.address),
    contractInteractions: summarizeContractInteractions(input.transactions),
    stablecoinFlow: summarizeStablecoinFlow(input.transactions, input.request.address),
    dataQuality: summarizeDataQuality({
      balances: input.balances,
      transactions: input.transactions,
      metrics,
    }),
  };
}
