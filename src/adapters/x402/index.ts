import { env, resolveRuntimeMode } from "@/config/env";
import { X402PaymentGate } from "@/types/adapters";
import { MockX402PaymentGate } from "@/adapters/x402/mock";
import { RealX402PaymentGate } from "@/adapters/x402/real";

export function createX402PaymentGate(): X402PaymentGate {
  return resolveRuntimeMode(env.x402Mode) === "mock" ? new MockX402PaymentGate() : new RealX402PaymentGate();
}
