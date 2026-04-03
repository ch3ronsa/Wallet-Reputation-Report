import { env, resolveRuntimeMode } from "@/config/env";
import { OwsAdapter } from "@/types/adapters";
import { MockOwsAdapter } from "@/adapters/ows/mock";
import { RealOwsAdapter } from "@/adapters/ows/real";

export function createOwsAdapter(): OwsAdapter {
  return resolveRuntimeMode(env.owsMode) === "mock" ? new MockOwsAdapter() : new RealOwsAdapter();
}
