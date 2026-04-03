import { isValidEvmAddress, normalizeAddress } from "@/lib/address";
import { WalletLookupRequest } from "@/types/api";
import { SupportedChain } from "@/types/domain";
import { z } from "zod";

const reportRequestSchema = z.object({
  address: z.string().transform(normalizeAddress),
  chain: z.enum(["base", "ethereum"]).default("base"),
});

export function parseReportRequest(input: unknown): WalletLookupRequest {
  const parsed = reportRequestSchema.parse(input);

  if (!isValidEvmAddress(parsed.address)) {
    throw new Error("Please provide a valid EVM wallet address.");
  }

  return {
    address: parsed.address,
    chain: parsed.chain as SupportedChain,
  };
}
