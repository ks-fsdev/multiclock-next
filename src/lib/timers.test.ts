import { describe, expect, it } from "vitest";
import {
  checkpointsOf,
  createTimerSchema,
  formatClock,
  formatShort,
} from "./timers";

describe("formatClock", () => {
  it("pads minutes and seconds", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(1500)).toBe("25:00");
  });

  it("lets minutes grow past 99", () => {
    expect(formatClock(6000)).toBe("100:00");
  });
});

describe("formatShort", () => {
  it("drops zero parts", () => {
    expect(formatShort(45)).toBe("45s");
    expect(formatShort(120)).toBe("2m");
    expect(formatShort(65)).toBe("1m 5s");
  });
});

describe("checkpointsOf", () => {
  it("returns cumulative block end times", () => {
    expect(checkpointsOf([60, 30, 90])).toEqual([60, 90, 180]);
    expect(checkpointsOf([])).toEqual([]);
  });
});

describe("createTimerSchema", () => {
  const valid = { label: "Deep Work", intervals: [1500, 300] };

  it("accepts a valid timer and trims the label", () => {
    const r = createTimerSchema.parse({ ...valid, label: "  Deep Work  " });
    expect(r.label).toBe("Deep Work");
  });

  it("strips unknown fields like a client-sent duration", () => {
    const r = createTimerSchema.parse({ ...valid, duration: 99999 });
    expect(r).not.toHaveProperty("duration");
  });

  it.each([
    ["empty label", { ...valid, label: "   " }],
    ["no blocks", { ...valid, intervals: [] }],
    ["negative block", { ...valid, intervals: [-5] }],
    ["fractional block", { ...valid, intervals: [1.5] }],
    ["block over 24h", { ...valid, intervals: [86_401] }],
    ["unknown color", { ...valid, color: "#000000" }],
    ["too many blocks", { ...valid, intervals: Array(21).fill(10) }],
  ])("rejects %s", (_name, input) => {
    expect(createTimerSchema.safeParse(input).success).toBe(false);
  });
});
