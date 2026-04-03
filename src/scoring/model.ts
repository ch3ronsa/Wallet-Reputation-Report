import { RiskLevel } from "@/types/domain";

export const SCORE_BASE = 100;

export const SCORE_THRESHOLDS: Record<RiskLevel, { min: number; max: number }> = {
  low: { min: 70, max: 100 },
  medium: { min: 40, max: 69 },
  high: { min: 0, max: 39 },
};

export const SIGNAL_WEIGHTS = {
  veryNewWallet: 18,
  veryLowHistory: 16,
  highTokenConcentration: 15,
  highCounterpartyConcentration: 12,
  unusualLargeTransfers: 12,
  frequentUnknownContractInteraction: 13,
  recentSuddenActivitySpike: 10,
  suspiciouslyNarrowBehaviorPattern: 9,
} as const;
