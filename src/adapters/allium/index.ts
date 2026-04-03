import { env, resolveRuntimeMode } from "@/config/env";
import { AlliumClient } from "@/types/adapters";
import { MockAlliumAdapter } from "@/adapters/allium/mock";
import { RealAlliumAdapter } from "@/adapters/allium/real";

export function createAlliumClient(): AlliumClient {
  const mode = resolveRuntimeMode(env.alliumMode);

  if (mode === "mock" || !env.alliumApiKey) {
    return new MockAlliumAdapter();
  }

  return new RealAlliumAdapter();
}
