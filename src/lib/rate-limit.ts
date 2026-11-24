import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getDb } from "./firebase";
import { applyLimit, type WindowState } from "./rate-limit-core";

export type Rule = { name: string; limit: number; windowMs: number };

export const RULES = {
  loginPerEmail: { name: "login-email", limit: 5, windowMs: 15 * 60_000 },
  loginPerIp: { name: "login-ip", limit: 20, windowMs: 15 * 60_000 },
  signupPerIp: { name: "signup-ip", limit: 5, windowMs: 60 * 60_000 },
} satisfies Record<string, Rule>;

export async function clientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Counts one attempt against `rule` for `key`. Stored in Firestore so the
 * limit holds across serverless instances. Keys are hashed, so no raw
 * emails or IPs are stored.
 */
export async function hit(rule: Rule, key: string) {
  const id = createHash("sha256").update(`${rule.name}:${key}`).digest("hex");
  const ref = getDb().collection("rateLimits").doc(id);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const result = applyLimit(
      snap.data() as WindowState | undefined,
      Date.now(),
      rule.limit,
      rule.windowMs,
    );
    if (result.ok) {
      tx.set(ref, {
        ...result.next,
        // Lets a Firestore TTL policy on `expiresAt` clean up old records.
        expiresAt: new Date(result.next.windowStart + rule.windowMs),
      });
    }
    return result;
  });
}

/** Clears a counter, e.g. the per-email login limit after a successful login. */
export async function reset(rule: Rule, key: string) {
  const id = createHash("sha256").update(`${rule.name}:${key}`).digest("hex");
  await getDb().collection("rateLimits").doc(id).delete();
}

export function tooManyMessage(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
