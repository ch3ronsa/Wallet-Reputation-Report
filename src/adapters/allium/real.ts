import { assertAlliumConfigured, env } from "@/config/env";
import { AlliumClient } from "@/types/adapters";
import { WalletLookupRequest } from "@/types/api";
import { WalletBalance, WalletProfile, WalletTransaction } from "@/types/domain";
import { buildWalletMetrics } from "@/scoring/engine";

type AlliumResponse = {
  items?: Array<Record<string, unknown>>;
};

function safeNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function extractLabels(item: Record<string, unknown>): string[] {
  const labels = item.labels;

  if (!Array.isArray(labels)) {
    return [];
  }

  return labels
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      if (entry && typeof entry === "object" && "name" in entry) {
        return safeString((entry as Record<string, unknown>).name);
      }

      return "";
    })
    .filter(Boolean);
}

function mapTransaction(item: Record<string, unknown>): WalletTransaction {
  return {
    hash: safeString(item.hash) || safeString(item.id),
    timestamp: safeString(item.block_timestamp) || new Date().toISOString(),
    success: item.success === false ? false : item.status === "failed" ? false : true,
    from: safeString(item.from_address) || safeString(item.from),
    to: safeString(item.to_address) || safeString(item.to),
    type: safeString(item.type),
    feeUsd: safeNumber((item.fee as Record<string, unknown> | undefined)?.amount) || safeNumber(item.fee_usd),
    valueUsd: safeNumber(item.value_usd),
    labels: extractLabels(item),
  };
}

function mapBalance(item: Record<string, unknown>): WalletBalance {
  const token = (item.token as Record<string, unknown> | undefined) ?? {};
  const tokenInfo = (token.info as Record<string, unknown> | undefined) ?? {};
  const symbol = safeString(tokenInfo.symbol) || safeString(item.symbol) || "UNKNOWN";

  return {
    symbol,
    tokenAddress: safeString(token.address) || safeString(item.token_address),
    amount:
      safeNumber(item.amount) ||
      safeNumber(item.balance) ||
      safeNumber(item.balance_formatted) ||
      safeNumber(item.raw_balance),
    usdValue: safeNumber(item.balance_usd) || safeNumber(item.value_usd) || safeNumber(item.usd_value),
    isStablecoin: ["USDC", "USDT", "DAI", "USDBC"].includes(symbol.toUpperCase()),
    isNative: token.type === "native" || ["ETH", "WETH"].includes(symbol.toUpperCase()),
  };
}

export class RealAlliumAdapter implements AlliumClient {
  private readonly baseUrl = env.alliumBaseUrl.replace(/\/$/, "");

  async getWalletProfile(request: WalletLookupRequest): Promise<WalletProfile> {
    assertAlliumConfigured();

    const [transactionItems, balanceItems] = await Promise.all([
      this.post("/api/v1/developer/wallet/transactions", [
        { chain: request.chain, address: request.address },
      ]),
      this.post("/api/v1/developer/wallet/balances", [
        { chain: request.chain, address: request.address },
      ]),
    ]);

    const transactions = (transactionItems.items ?? []).map(mapTransaction).filter((item) => item.hash);
    const balances = (balanceItems.items ?? []).map(mapBalance).filter((item) => item.amount > 0 || item.usdValue > 0);

    return {
      address: request.address,
      chain: request.chain,
      dataSource: "allium",
      observedAt: new Date().toISOString(),
      balances,
      transactions,
      metrics: buildWalletMetrics({ balances, transactions }),
    };
  }

  private async post(path: string, body: unknown): Promise<AlliumResponse> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.alliumApiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Allium request failed (${response.status}): ${details}`);
    }

    return (await response.json()) as AlliumResponse;
  }
}
