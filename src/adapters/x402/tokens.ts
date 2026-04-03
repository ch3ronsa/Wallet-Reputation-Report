import { env } from "@/config/env";
import { WalletLookupRequest } from "@/types/api";
import { createHmac, timingSafeEqual } from "crypto";

type SignedPayload = {
  type: "x402-session" | "x402-unlock";
  reportRequest: WalletLookupRequest;
  issuedAt: number;
  expiresAt: number;
};

function signPayload(payload: SignedPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", env.x402UnlockSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifySignature(token: string): SignedPayload | null {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = createHmac("sha256", env.x402UnlockSecret).update(body).digest("base64url");
  const bodyBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (bodyBuffer.length !== expectedBuffer.length || !timingSafeEqual(bodyBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignedPayload;

    if (!payload || typeof payload !== "object") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createSignedSessionToken(reportRequest: WalletLookupRequest): string {
  const now = Date.now();

  return signPayload({
    type: "x402-session",
    reportRequest,
    issuedAt: now,
    expiresAt: now + env.x402UnlockTtlMs,
  });
}

export function createSignedUnlockToken(reportRequest: WalletLookupRequest): string {
  const now = Date.now();

  return signPayload({
    type: "x402-unlock",
    reportRequest,
    issuedAt: now,
    expiresAt: now + env.x402UnlockTtlMs,
  });
}

export function readSignedToken(token: string | null | undefined): SignedPayload | null {
  if (!token) {
    return null;
  }

  const payload = verifySignature(token);

  if (!payload || payload.expiresAt < Date.now()) {
    return null;
  }

  return payload;
}
