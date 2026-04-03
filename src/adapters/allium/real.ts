import { ALLIUM_ASSUMPTIONS } from "@/adapters/allium/assumptions";
import { normalizeWalletProfile } from "@/adapters/allium/normalize";
import { assertAlliumConfigured, env } from "@/config/env";
import { AlliumClient } from "@/types/adapters";
import { WalletLookupRequest } from "@/types/api";
import { WalletBalance, WalletProfile, WalletTransaction } from "@/types/domain";

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

function readNestedValue(item: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, item);
}

function readFirst(item: Record<string, unknown>, paths: readonly string[]): unknown {
  for (const path of paths) {
    const value = readNestedValue(item, path);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function extractLabels(item: Record<string, unknown>): string[] {
  const labels = readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.labels);

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

function mapTransaction(item: Record<string, unknown>): WalletTransaction | null {
  const hash = safeString(readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.hash));

  if (!hash) {
    return null;
  }

  const successValue = readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.success);
  const status = typeof successValue === "string" ? successValue.toLowerCase() : "";

  return {
    hash,
    timestamp: safeString(readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.timestamp)) || new Date().toISOString(),
    success: successValue === false ? false : status === "failed" ? false : true,
    from: safeString(readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.from)) || undefined,
    to: safeString(readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.to)) || undefined,
    type: safeString(readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.type)) || "unknown",
    feeUsd: safeNumber(readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.feeUsd)),
    valueUsd: safeNumber(readFirst(item, ALLIUM_ASSUMPTIONS.transactionFields.valueUsd)),
    labels: extractLabels(item),
  };
}

function mapBalance(item: Record<string, unknown>): WalletBalance {
  const symbol = safeString(readFirst(item, ALLIUM_ASSUMPTIONS.balanceFields.symbol)) || "UNKNOWN";
  const tokenType = safeString(readFirst(item, ALLIUM_ASSUMPTIONS.balanceFields.tokenType));

  return {
    symbol,
    tokenAddress: safeString(readFirst(item, ALLIUM_ASSUMPTIONS.balanceFields.tokenAddress)) || undefined,
    amount: safeNumber(readFirst(item, ALLIUM_ASSUMPTIONS.balanceFields.amount)),
    usdValue: safeNumber(readFirst(item, ALLIUM_ASSUMPTIONS.balanceFields.usdValue)),
    isStablecoin: ["USDC", "USDT", "DAI", "USDBC"].includes(symbol.toUpperCase()),
    isNative: tokenType === "native" || ["ETH", "WETH"].includes(symbol.toUpperCase()),
  };
}

export class AlliumHttpClient {
  private readonly baseUrl = env.alliumBaseUrl.replace(/\/$/, "");

  async post(path: string, body: unknown): Promise<AlliumResponse> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.alliumApiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (response.status === 204 || response.status === 404 || response.status === 422) {
      return { items: [] };
    }

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Allium request failed (${response.status}): ${details}`);
    }

    const data = (await response.json()) as AlliumResponse;
    return {
      items: Array.isArray(data.items) ? data.items : [],
    };
  }
}

export class RealAlliumAdapter implements AlliumClient {
  constructor(private readonly httpClient: AlliumHttpClient = new AlliumHttpClient()) {}

  async getWalletProfile(request: WalletLookupRequest): Promise<WalletProfile> {
    assertAlliumConfigured();

    const [transactionResponse, balanceResponse] = await Promise.all([
      this.httpClient.post(ALLIUM_ASSUMPTIONS.endpoints.transactions, [
        { chain: request.chain, address: request.address },
      ]),
      this.httpClient.post(ALLIUM_ASSUMPTIONS.endpoints.balances, [
        { chain: request.chain, address: request.address },
      ]),
    ]);

    const transactions = (transactionResponse.items ?? [])
      .map(mapTransaction)
      .filter((item): item is WalletTransaction => Boolean(item));
    const balances = (balanceResponse.items ?? [])
      .map(mapBalance)
      .filter((item) => item.amount > 0 || item.usdValue > 0);

    return normalizeWalletProfile({
      request,
      dataSource: "allium",
      observedAt: new Date().toISOString(),
      balances,
      transactions,
    });
  }
}
