import { SupportedChain } from "@/types/domain";

type RuntimeMode = "mock" | "real";

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return value;
}

function readMode(name: string, fallback: RuntimeMode): RuntimeMode {
  const value = process.env[name] ?? fallback;

  if (value !== "mock" && value !== "real") {
    throw new Error(`Environment variable ${name} must be "mock" or "real"`);
  }

  return value;
}

export const env = {
  appMode: readMode("APP_MODE", "mock"),
  alliumMode: readMode("ALLIUM_MODE", "mock"),
  owsMode: readMode("OWS_MODE", "mock"),
  x402Mode: readMode("X402_MODE", "mock"),
  moonPayMode: readMode("MOONPAY_MODE", "mock"),
  alliumApiKey: process.env.ALLIUM_API_KEY ?? "",
  alliumBaseUrl: process.env.ALLIUM_BASE_URL ?? "https://api.allium.so",
  reportChain: (process.env.REPORT_CHAIN ?? "base") as SupportedChain,
  reportLookbackDays: readOptionalNumber("REPORT_LOOKBACK_DAYS", 30),
  owsServiceWalletName: process.env.OWS_SERVICE_WALLET_NAME ?? "wallet-reputation-report",
  owsServiceAddress: process.env.OWS_SERVICE_ADDRESS ?? "",
  owsPublicPaymentUrl: process.env.OWS_PUBLIC_PAYMENT_URL ?? "http://localhost:3000/api/report/full",
  x402PriceUsdc: String(readOptionalNumber("X402_PRICE_USDC", 0.25)),
  x402Network: (process.env.X402_NETWORK ?? "base") as SupportedChain,
  x402Asset: process.env.X402_ASSET ?? "USDC",
  x402Description: process.env.X402_DESCRIPTION ?? "Full wallet reputation report",
  moonpayDefaultFiat: process.env.MOONPAY_DEFAULT_FIAT ?? "USD",
  moonpayDefaultAmount: readOptionalNumber("MOONPAY_DEFAULT_AMOUNT", 10),
  demoPaidHeaderValue: process.env.DEMO_PAID_HEADER_VALUE ?? "paid",
};

export function assertAlliumConfigured(): void {
  if (!env.alliumApiKey) {
    throw new Error("ALLIUM_API_KEY is required to fetch wallet intelligence");
  }
}

export function requireServiceAddress(): string {
  return readEnv("OWS_SERVICE_ADDRESS");
}

export function resolveRuntimeMode(mode: RuntimeMode): "mock" | "real" {
  return env.appMode === "mock" ? "mock" : mode;
}
