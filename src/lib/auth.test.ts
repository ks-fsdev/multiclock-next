import { beforeAll, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import { loginSchema, signupSchema } from "./auth-schemas";
import { signSession, verifySession } from "./session-token";

const SECRET = "test-secret-that-is-at-least-32-characters-long";

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

describe("session tokens", () => {
  it("round-trips the user id", async () => {
    const token = await signSession({ userId: "user_123" });
    expect(await verifySession(token)).toEqual({ userId: "user_123" });
  });

  it("rejects a missing or garbage token", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("not.a.jwt")).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signSession({ userId: "user_123" });
    const [h, , s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ userId: "admin" })).toString("base64url");
    expect(await verifySession(`${h}.${forged}.${s}`)).toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const token = await new SignJWT({ userId: "user_123" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-different-secret-also-32-characters!!"));
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects an unsigned (alg: none) token", async () => {
    const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const token = `${enc({ alg: "none" })}.${enc({ userId: "user_123" })}.`;
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const token = await signSession({ userId: "user_123" });
      vi.setSystemTime(new Date("2026-01-09T00:00:00Z")); // 8 days later
      expect(await verifySession(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("refuses to run with a short secret", async () => {
    process.env.SESSION_SECRET = "too-short";
    await expect(signSession({ userId: "x" })).rejects.toThrow(/SESSION_SECRET/);
    process.env.SESSION_SECRET = SECRET;
  });
});

describe("signupSchema", () => {
  const valid = { name: "Ada", email: "Ada@Example.com ", password: "passw0rd" };

  it("normalizes email to trimmed lowercase", () => {
    expect(signupSchema.parse(valid).email).toBe("ada@example.com");
  });

  it.each([
    ["short password", { ...valid, password: "pa55" }],
    ["password without a number", { ...valid, password: "password" }],
    ["password without a letter", { ...valid, password: "12345678" }],
    ["password over bcrypt's 72 bytes", { ...valid, password: "a1".repeat(37) }],
    ["invalid email", { ...valid, email: "not-an-email" }],
    ["one-letter name", { ...valid, name: "A" }],
  ])("rejects %s", (_name, input) => {
    expect(signupSchema.safeParse(input).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("does not apply signup password rules (old passwords still log in)", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});
