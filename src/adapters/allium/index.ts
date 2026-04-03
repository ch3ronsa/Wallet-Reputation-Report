import { env, resolveRuntimeMode } from "@/config/env";
import { AlliumClient } from "@/types/adapters";
import { MockAlliumAdapter } from "@/adapters/allium/mock";
import { RealAlliumAdapter } from "@/adapters/allium/real";

export function createAlliumClient(): AlliumClient {
  return resolveRuntimeMode(env.alliumMode) === "mock" ? new MockAlliumAdapter() : new RealAlliumAdapter();
}
