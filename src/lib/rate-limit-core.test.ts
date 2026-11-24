import { describe, expect, it } from "vitest";
import { applyLimit, type WindowState } from "./rate-limit-core";

const WINDOW = 15 * 60_000;
const LIMIT = 5;

describe("applyLimit", () => {
  it("starts a new window on the first attempt", () => {
    const r = applyLimit(undefined, 1000, LIMIT, WINDOW);
    expect(r).toEqual({ ok: true, next: { count: 1, windowStart: 1000 } });
  });

  it("allows up to the limit, then blocks", () => {
    let state: WindowState | undefined;
    for (let i = 0; i < LIMIT; i++) {
      const r = applyLimit(state, 1000 + i, LIMIT, WINDOW);
      expect(r.ok).toBe(true);
      if (r.ok) state = r.next;
    }
    expect(applyLimit(state, 2000, LIMIT, WINDOW).ok).toBe(false);
  });

  it("reports how long until the window resets", () => {
    const state = { count: LIMIT, windowStart: 0 };
    const r = applyLimit(state, 5 * 60_000, LIMIT, WINDOW);
    expect(r).toEqual({ ok: false, retryAfterSeconds: 10 * 60 });
  });

  it("resets once the window has passed", () => {
    const state = { count: LIMIT, windowStart: 0 };
    const r = applyLimit(state, WINDOW, LIMIT, WINDOW);
    expect(r).toEqual({ ok: true, next: { count: 1, windowStart: WINDOW } });
  });
});
