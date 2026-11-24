import { describe, expect, it } from "vitest";
import { blockFill, crossedCheckpoint, remainingSeconds } from "./countdown";

describe("remainingSeconds", () => {
  const now = 1_000_000;

  it("rounds partial seconds up", () => {
    expect(remainingSeconds(now + 10_000, now)).toBe(10);
    expect(remainingSeconds(now + 9_001, now)).toBe(10);
    expect(remainingSeconds(now + 200, now)).toBe(1);
  });

  it("never goes negative", () => {
    expect(remainingSeconds(now - 5_000, now)).toBe(0);
  });

  it("stays accurate across a long gap between ticks (throttled tab)", () => {
    const endsAt = now + 60_000;
    // The tab sleeps for 37.5s; the next tick still reports the true time.
    expect(remainingSeconds(endsAt, now + 37_500)).toBe(23);
  });
});

describe("crossedCheckpoint", () => {
  const checkpoints = [60, 90, 180];

  it("fires when a tick lands exactly on a checkpoint", () => {
    expect(crossedCheckpoint(checkpoints, 59, 60)).toBe(true);
  });

  it("does not fire between checkpoints", () => {
    expect(crossedCheckpoint(checkpoints, 60, 61)).toBe(false);
  });

  it("fires once when several seconds are skipped past a checkpoint", () => {
    expect(crossedCheckpoint(checkpoints, 55, 70)).toBe(true);
  });

  it("does not refire for a checkpoint already passed", () => {
    expect(crossedCheckpoint(checkpoints, 60, 60)).toBe(false);
  });
});

describe("blockFill", () => {
  const intervals = [60, 30];
  const checkpoints = [60, 90];

  it("fills blocks in order", () => {
    expect(blockFill(intervals, checkpoints, 0)).toEqual([0, 0]);
    expect(blockFill(intervals, checkpoints, 30)).toEqual([50, 0]);
    expect(blockFill(intervals, checkpoints, 75)).toEqual([100, 50]);
    expect(blockFill(intervals, checkpoints, 90)).toEqual([100, 100]);
  });
});
