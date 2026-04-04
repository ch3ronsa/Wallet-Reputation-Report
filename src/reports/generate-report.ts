import { createAlliumClient } from "@/adapters/allium";
import { scoreWallet } from "@/scoring/engine";
import { ReportGenerator } from "@/types/adapters";
import { WalletLookupRequest } from "@/types/api";
import {
  ActivityTypeSummary,
  ConfidenceLevel,
  FreeSummary,
  FullReport,
  FullReportFacts,
  FullReportInterpretation,
  FullReportOperatorView,
  GeneratedReportBundle,
  OperatorDecision,
  QuickWalletSnapshot,
  RiskLevel,
  WalletProfile,
} from "@/types/domain";

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function buildQuickSnapshot(wallet: WalletProfile): QuickWalletSnapshot {
  return {
    walletAgeDays: wallet.age.walletAgeDays,
    transactionCount: wallet.activity.txCount,
    activeDays: wallet.activity.uniqueActiveDays,
    uniqueCounterparties: wallet.metrics.uniqueCounterparties,
    visiblePortfolioUsd: wallet.metrics.totalPortfolioUsd,
    recentTxCount7d: wallet.activity.recentTxCount7d,
    dominantAssetShare: wallet.tokenConcentration[0]?.share ?? null,
  };
}

function buildFreeSummary(input: {
  wallet: WalletProfile;
  riskLevel: RiskLevel;
  summaryReasons: string[];
  uncertaintyNote: string | null;
}): FreeSummary {
  return {
    walletAddress: input.wallet.address,
    chain: input.wallet.chain,
    overallRiskLevel: input.riskLevel,
    keyReasons: input.summaryReasons.slice(0, 3),
    quickSnapshot: buildQuickSnapshot(input.wallet),
    uncertaintyNote: input.uncertaintyNote,
  };
}

function buildConcentrationObservations(wallet: WalletProfile): string[] {
  const observations: string[] = [];
  const topAsset = wallet.tokenConcentration[0];

  if (topAsset) {
    observations.push(
      `${topAsset.symbol} represents ${Math.round(topAsset.share * 100)}% of visible holdings (${formatUsd(topAsset.usdValue)}).`,
    );
  }

  if (wallet.tokenConcentration.length > 1) {
    observations.push(
      `Top ${wallet.tokenConcentration.length} visible assets account for ${Math.round(
        wallet.tokenConcentration.reduce((sum, asset) => sum + asset.share, 0) * 100,
      )}% of tracked portfolio value.`,
    );
  }

  if (wallet.stablecoinFlow.available) {
    observations.push(
      `Stablecoin flow shows ${formatUsd(wallet.stablecoinFlow.inboundUsd)} inbound and ${formatUsd(
        wallet.stablecoinFlow.outboundUsd,
      )} outbound across ${wallet.stablecoinFlow.transferCount} observed transfer(s).`,
    );
  }

  if (observations.length === 0) {
    observations.push("Visible balance concentration is limited because holdings data is sparse or unavailable.");
  }

  return observations;
}

function buildActivityObservations(wallet: WalletProfile): string[] {
  const observations = [
    `Observed ${wallet.activity.txCount} transaction(s) across ${wallet.activity.uniqueActiveDays} active day(s).`,
    `Recent 7-day activity count is ${wallet.activity.recentTxCount7d} with an average of ${wallet.activity.avgTxPerActiveDay.toFixed(
      2,
    )} transactions per active day.`,
    `Contract interaction pattern is ${wallet.contractInteractions.pattern} with ${wallet.contractInteractions.totalContractCalls} contract-oriented interaction(s).`,
  ];

  if (wallet.age.firstSeenAt && wallet.age.lastSeenAt) {
    observations.push(`Observed wallet activity ranges from ${wallet.age.firstSeenAt} to ${wallet.age.lastSeenAt}.`);
  }

  return observations;
}

function buildLimitations(wallet: WalletProfile): string[] {
  const limitations = [...wallet.dataQuality.warnings];

  if (wallet.topCounterparties.length === 0) {
    limitations.push("No notable counterparties could be ranked from the currently observed activity.");
  }

  if (!wallet.stablecoinFlow.available) {
    limitations.push("Stablecoin flow was not clearly derivable from the observed transaction labels.");
  }

  return limitations.length > 0 ? limitations : ["No major data limitations were detected in the normalized profile."];
}

function buildFacts(wallet: WalletProfile): FullReportFacts {
  return {
    notableCounterparties: wallet.topCounterparties,
    concentrationObservations: buildConcentrationObservations(wallet),
    activityObservations: buildActivityObservations(wallet),
    limitations: buildLimitations(wallet),
  };
}

function resolveConfidenceLevel(wallet: WalletProfile): ConfidenceLevel {
  if (wallet.dataQuality.isSparse || wallet.activity.txCount < 3) {
    return "limited";
  }

  if (wallet.activity.txCount < 10 || wallet.dataQuality.warnings.length > 0) {
    return "medium";
  }

  return "high";
}

function buildConfidenceNote(wallet: WalletProfile, confidenceLevel: ConfidenceLevel): string {
  if (confidenceLevel === "high") {
    return "Confidence is relatively strong because the wallet shows enough balances and transaction history for pattern detection.";
  }

  if (confidenceLevel === "medium") {
    return "Confidence is moderate because the wallet has some observable history, but coverage is not yet deep.";
  }

  if (wallet.dataQuality.warnings.length > 0) {
    return `Confidence is limited because ${wallet.dataQuality.warnings.join(" ")}`;
  }

  return "Confidence is limited because the wallet has a shallow observable footprint.";
}

function resolveOperatorDecision(input: {
  riskLevel: RiskLevel;
  confidenceLevel: ConfidenceLevel;
}): OperatorDecision {
  if (input.riskLevel === "high") {
    return "restrict";
  }

  if (input.riskLevel === "medium") {
    return "review";
  }

  return input.confidenceLevel === "limited" ? "review" : "allow";
}

function buildBehaviorPattern(wallet: WalletProfile): string {
  if (wallet.contractInteractions.pattern === "contract-heavy") {
    return "Contract-heavy behavior with repeated smart-contract interaction.";
  }

  if (wallet.contractInteractions.pattern === "transfer-heavy") {
    return "Transfer-heavy behavior with limited contract diversity.";
  }

  if (wallet.contractInteractions.pattern === "mixed") {
    return "Mixed behavior across transfers, contracts, and treasury movement.";
  }

  return "Sparse or inactive behavior with limited observable activity.";
}

function normalizeActivityLabel(rawType?: string, labels?: string[]): string {
  const haystack = `${rawType ?? ""} ${(labels ?? []).join(" ")}`.toLowerCase();

  if (haystack.includes("bridge")) {
    return "Bridge";
  }

  if (haystack.includes("swap") || haystack.includes("dex")) {
    return "DEX trading";
  }

  if (haystack.includes("stable")) {
    return "Stablecoin flow";
  }

  if (haystack.includes("nft") || haystack.includes("mint")) {
    return "NFT activity";
  }

  if (haystack.includes("contract")) {
    return "Contract interaction";
  }

  if (haystack.includes("transfer")) {
    return "Transfers";
  }

  return "Other";
}

function buildTopActivityTypes(wallet: WalletProfile): ActivityTypeSummary[] {
  const counts = new Map<string, number>();

  for (const activity of wallet.recentActivity) {
    const label = normalizeActivityLabel(activity.type, activity.labels);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return [{ label: "Unclassified", count: 0, share: 0 }];
  }

  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label, count]) => ({
      label,
      count,
      share: total > 0 ? count / total : 0,
    }));
}

function buildFundingSourceNote(wallet: WalletProfile): string {
  const inboundLeader = [...wallet.topCounterparties]
    .filter((counterparty) => counterparty.inboundCount > 0)
    .sort((left, right) => right.inboundCount - left.inboundCount)[0];

  if (!inboundLeader) {
    return "No clear inbound funding source stands out from the observed counterparty set.";
  }

  const labelText = inboundLeader.labels.length > 0 ? ` Labels: ${inboundLeader.labels.slice(0, 2).join(", ")}.` : "";

  return `Most visible inbound activity points to ${inboundLeader.address}, which appears in ${inboundLeader.inboundCount} inbound interaction(s).${labelText}`;
}

function buildOperatorView(input: {
  wallet: WalletProfile;
  riskLevel: RiskLevel;
}): FullReportOperatorView {
  const confidenceLevel = resolveConfidenceLevel(input.wallet);

  return {
    operatorDecision: resolveOperatorDecision({
      riskLevel: input.riskLevel,
      confidenceLevel,
    }),
    behaviorPattern: buildBehaviorPattern(input.wallet),
    topActivityTypes: buildTopActivityTypes(input.wallet),
    fundingSourceNote: buildFundingSourceNote(input.wallet),
    confidenceLevel,
    confidenceNote: buildConfidenceNote(input.wallet, confidenceLevel),
  };
}

function buildInterpretation(input: {
  wallet: WalletProfile;
  riskLevel: RiskLevel;
  totalScore: number;
  summaryReasons: string[];
  uncertaintyNote: string | null;
}): FullReportInterpretation {
  const plainLanguageByRisk: Record<RiskLevel, string> = {
    low: "The wallet looks comparatively stable based on the deterministic signals currently observed.",
    medium: "The wallet shows a mixed pattern and warrants review before higher-trust workflows.",
    high: "The wallet triggers several elevated-risk signals and should remain in restricted or lower-trust flows.",
  };

  const trustPostureByRisk: Record<RiskLevel, string> = {
    low: "Reasonable candidate for allowlists, higher quotas, or better commercial terms with monitoring.",
    medium: "Suitable for guarded onboarding, tighter limits, or additional review before monetized access.",
    high: "Best handled with stricter gating, lower limits, or additional verification before monetized access.",
  };

  const monetizationNoteByRisk: Record<RiskLevel, string> = {
    low: "This profile supports a premium decision-support workflow because the signals point to relatively lower observable risk.",
    medium: "This profile is monetizable because it gives operators a structured way to price uncertainty and review mixed signals.",
    high: "This profile is monetizable because it highlights exactly why a wallet should face tighter commercial controls.",
  };

  const suffix = input.summaryReasons.length > 0 ? ` Key drivers: ${input.summaryReasons.slice(0, 2).join(" ")}` : "";
  const uncertainty = input.uncertaintyNote ? ` ${input.uncertaintyNote}` : "";

  return {
    plainLanguage: `${plainLanguageByRisk[input.riskLevel]} Deterministic score: ${input.totalScore}/100.${suffix}${uncertainty}`,
    trustPosture: trustPostureByRisk[input.riskLevel],
    monetizationNote: monetizationNoteByRisk[input.riskLevel],
  };
}

function buildFullReport(input: {
  wallet: WalletProfile;
  freeSummary: FreeSummary;
  generatedAt: string;
  totalScore: number;
  riskLevel: RiskLevel;
  signals: GeneratedReportBundle["score"]["signals"];
  summaryReasons: string[];
  uncertaintyNote: string | null;
}): FullReport {
  return {
    walletAddress: input.wallet.address,
    chain: input.wallet.chain,
    generatedAt: input.generatedAt,
    freeSummary: input.freeSummary,
    scoreBreakdown: {
      totalScore: input.totalScore,
      riskLevel: input.riskLevel,
      signals: input.signals,
    },
    operatorView: buildOperatorView({
      wallet: input.wallet,
      riskLevel: input.riskLevel,
    }),
    facts: buildFacts(input.wallet),
    interpretation: buildInterpretation({
      wallet: input.wallet,
      riskLevel: input.riskLevel,
      totalScore: input.totalScore,
      summaryReasons: input.summaryReasons,
      uncertaintyNote: input.uncertaintyNote,
    }),
  };
}

export class DefaultReportGenerator implements ReportGenerator {
  async generate(request: WalletLookupRequest): Promise<GeneratedReportBundle> {
    const alliumClient = createAlliumClient();
    const wallet = await alliumClient.getWalletProfile(request);
    const score = scoreWallet(wallet);
    const generatedAt = new Date().toISOString();
    const freeSummary = buildFreeSummary({
      wallet,
      riskLevel: score.riskLevel,
      summaryReasons: score.summaryReasons,
      uncertaintyNote: score.uncertaintyNote,
    });
    const fullReport = buildFullReport({
      wallet,
      freeSummary,
      generatedAt,
      totalScore: score.totalScore,
      riskLevel: score.riskLevel,
      signals: score.signals,
      summaryReasons: score.summaryReasons,
      uncertaintyNote: score.uncertaintyNote,
    });

    return {
      wallet,
      score,
      freeSummary,
      fullReport,
      generatedAt,
    };
  }
}

export async function generateWalletReport(request: WalletLookupRequest): Promise<GeneratedReportBundle> {
  return new DefaultReportGenerator().generate(request);
}
