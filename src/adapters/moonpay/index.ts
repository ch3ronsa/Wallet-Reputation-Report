import { env, resolveRuntimeMode } from "@/config/env";
import { MoonPayAdapter } from "@/types/adapters";
import { MockMoonPayAdapter } from "@/adapters/moonpay/mock";
import { RealMoonPayAdapter } from "@/adapters/moonpay/real";

export function createMoonPayAdapter(): MoonPayAdapter {
  return resolveRuntimeMode(env.moonPayMode) === "mock" ? new MockMoonPayAdapter() : new RealMoonPayAdapter();
}
