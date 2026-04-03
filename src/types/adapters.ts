import { NextRequest } from "next/server";
import { GeneratedReportBundle, SupportedChain, WalletProfile } from "@/types/domain";
import { WalletLookupRequest, X402PaymentRequirement } from "@/types/api";

export interface AlliumClient {
  getWalletProfile(request: WalletLookupRequest): Promise<WalletProfile>;
}

export interface OwsServiceIdentity {
  walletName: string;
  address: string;
  chain: SupportedChain;
}

export interface OwsAdapter {
  getServiceIdentity(): Promise<OwsServiceIdentity>;
  buildBuyerCommands(request: WalletLookupRequest): Promise<string[]>;
}

export interface PaymentAccessResult {
  paid: boolean;
  requirements?: X402PaymentRequirement[];
}

export interface X402PaymentGate {
  checkAccess(input: { request: NextRequest; reportRequest: WalletLookupRequest }): Promise<PaymentAccessResult>;
  encodePaymentRequiredHeader(requirements: X402PaymentRequirement[]): string;
}

export interface MoonPayFundingPlan {
  skillName: string;
  description: string;
  commands: string[];
}

export interface MoonPayAdapter {
  getFundingPlan(input: { walletAddress?: string; chain: SupportedChain }): Promise<MoonPayFundingPlan>;
}

export interface ReportGenerator {
  generate(request: WalletLookupRequest): Promise<GeneratedReportBundle>;
}
