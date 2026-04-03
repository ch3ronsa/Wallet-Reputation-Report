import { AlliumClient } from "@/types/adapters";
import { WalletLookupRequest } from "@/types/api";
import { WalletProfile } from "@/types/domain";
import { buildWalletMetrics } from "@/scoring/engine";

function buildMockProfile(request: WalletLookupRequest): WalletProfile {
  const transactions = [
    {
      hash: "0xmock1",
      timestamp: "2026-04-01T10:00:00.000Z",
      success: true,
      from: request.address,
      to: "0x1111111111111111111111111111111111111111",
      type: "swap",
      feeUsd: 0.08,
      valueUsd: 280,
      labels: ["dex"],
    },
    {
      hash: "0xmock2",
      timestamp: "2026-03-29T12:20:00.000Z",
      success: true,
      from: "0x2222222222222222222222222222222222222222",
      to: request.address,
      type: "transfer",
      feeUsd: 0.02,
      valueUsd: 120,
      labels: ["stablecoin-transfer"],
    },
    {
      hash: "0xmock3",
      timestamp: "2026-03-23T09:40:00.000Z",
      success: false,
      from: request.address,
      to: "0x3333333333333333333333333333333333333333",
      type: "contract-call",
      feeUsd: 0.15,
      valueUsd: 0,
      labels: ["nft"],
    },
  ];

  const balances = [
    {
      symbol: "USDC",
      tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      amount: 320,
      usdValue: 320,
      isStablecoin: true,
      isNative: false,
    },
    {
      symbol: "ETH",
      amount: 0.18,
      usdValue: 540,
      isStablecoin: false,
      isNative: true,
    },
    {
      symbol: "DEGEN",
      tokenAddress: "0x000000000000000000000000000000000000dEaD",
      amount: 15000,
      usdValue: 140,
      isStablecoin: false,
      isNative: false,
    },
  ];

  return {
    address: request.address,
    chain: request.chain,
    dataSource: "mock",
    observedAt: new Date().toISOString(),
    balances,
    transactions,
    metrics: buildWalletMetrics({ balances, transactions }),
  };
}

export class MockAlliumAdapter implements AlliumClient {
  async getWalletProfile(request: WalletLookupRequest): Promise<WalletProfile> {
    return buildMockProfile(request);
  }
}
