import { NextRequest } from "next/server";
import { GeneratedReportBundle, SupportedChain, WalletProfile } from "@/types/domain";
import { UnlockSession, WalletLookupRequest, X402PaymentRequirement } from "@/types/api";

export interface AlliumClient {
  getWalletProfile(request: WalletLookupRequest): Promise<WalletProfile>;
}

export interface OwsServiceIdentity {
  walletName: string;
  address: string;
  chain: SupportedChain;
}

export interface OwsCliWorkflow {
  setupCommands: string[];
  unlockCommands: string[];
  note: string;
}

export interface OwsAdapter {
  getServiceIdentity(): Promise<OwsServiceIdentity>;
  buildBuyerCommands(request: WalletLookupRequest): Promise<string[]>;
  buildCliWorkflow(input: { reportRequest: WalletLookupRequest; serviceIdentity: OwsServiceIdentity }): Promise<OwsCliWorkflow>;
}

export interface PaymentAccessResult {
  paid: boolean;
  requirements?: X402PaymentRequirement[];
  unlockToken?: string;
}

export interface X402PaymentGate {
  checkAccess(input: { request: NextRequest; reportRequest: WalletLookupRequest }): Promise<PaymentAccessResult>;
  createUnlockSession(input: { reportRequest: WalletLookupRequest }): Promise<UnlockSession>;
  verifyUnlockSession(input: {
    request: NextRequest;
    reportRequest: WalletLookupRequest;
    sessionId: string;
  }): Promise<UnlockSession>;
  encodePaymentRequiredHeader(requirements: X402PaymentRequirement[]): string;
}

export interface MoonPayFundingPlan {
  available: boolean;
  skillName: string;
  description: string;
  targetWalletName?: string;
  targetWalletAddress?: string;
  targetAsset?: string;
  suggestedAmount?: number;
  fallbackMessage?: string;
  commands: string[];
}

export interface MoonPayAdapter {
  getFundingPlan(input: { walletAddress?: string; chain: SupportedChain }): Promise<MoonPayFundingPlan>;
}

export interface ReportGenerator {
  generate(request: WalletLookupRequest): Promise<GeneratedReportBundle>;
}
