import { assertAlliumConfigured, env } from "@/config/env";
import { SupportedChain, WalletBalance, WalletSnapshot, WalletTransaction } from "@/types/report";

type AlliumTransactionResponse = {
  items?: Array<Record<string, unknown>>;
};

type AlliumBalanceResponse = {
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
  const raw = item.labels;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((label) => {
      if (typeof label === "string") {
        return label;
      }

      if (label && typeof label === "object" && "name" in label) {
        return safeString((label as Record<string, unknown>).name);
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
    feeUsd:
      safeNumber((item.fee as Record<string, unknown> | undefined)?.amount) ||
      safeNumber((item.fee_usd as unknown) ?? 0),
    valueUsd: safeNumber(item.value_usd),
    labels: extractLabels(item),
  };
}

function mapBalance(item: Record<string, unknown>): WalletBalance {
  const token = (item.token as Record<string, unknown> | undefined) ?? {};
  const info = (token.info as Record<string, unknown> | undefined) ?? {};
  const symbol = safeString(info.symbol) || safeString(item.symbol) || "UNKNOWN";
  const usdValue =
    safeNumber((item.balance_usd as unknown) ?? 0) ||
    safeNumber((item.value_usd as unknown) ?? 0) ||
    safeNumber((item.usd_value as unknown) ?? 0);
  const amount =
    safeNumber(item.amount) ||
    safeNumber(item.balance) ||
    safeNumber(item.balance_formatted) ||
    safeNumber(item.raw_balance);

  return {
    symbol,
    tokenAddress: safeString(token.address) || safeString(item.token_address),
    amount,
    usdValue,
    isStablecoin: ["USDC", "USDT", "DAI", "USDBC"].includes(symbol.toUpperCase()),
    isNative: token.type === "native" || ["ETH", "WETH"].includes(symbol.toUpperCase()),
  };
}

export class AlliumClient {
  private readonly baseUrl = env.alliumBaseUrl.replace(/\/$/, "");

  async getWalletSnapshot(input: { address: string; chain: SupportedChain }): Promise<WalletSnapshot> {
    assertAlliumConfigured();

    const [transactions, balances] = await Promise.all([
      this.fetchTransactions(input),
      this.fetchBalances(input),
    ]);

    return {
      chain: input.chain,
      address: input.address,
      transactions,
      balances,
    };
  }

  private async fetchTransactions(input: {
    address: string;
    chain: SupportedChain;
  }): Promise<WalletTransaction[]> {
    const data = await this.post<AlliumTransactionResponse>("/api/v1/developer/wallet/transactions", [
      {
        chain: input.chain,
        address: input.address,
      },
    ]);

    return (data.items ?? []).map(mapTransaction).filter((item) => item.hash);
  }

  private async fetchBalances(input: {
    address: string;
    chain: SupportedChain;
  }): Promise<WalletBalance[]> {
    const data = await this.post<AlliumBalanceResponse>("/api/v1/developer/wallet/balances", [
      {
        chain: input.chain,
        address: input.address,
      },
    ]);

    return (data.items ?? []).map(mapBalance).filter((item) => item.usdValue > 0 || item.amount > 0);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
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

    return (await response.json()) as T;
  }
}
