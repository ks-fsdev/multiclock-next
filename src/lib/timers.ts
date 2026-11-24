import { z } from "zod";

// Shared by the form (client) and the API (server) so both validate identically.

export const ALLOWED_COLORS = [
  "#FF5733",
  "#F0F0F0",
  "#FF2A6D",
  "#39FF14",
  "#FAEA48",
  "#9D4EDD",
] as const;

export type TimerColor = (typeof ALLOWED_COLORS)[number];

export const MAX_TIMERS = ALLOWED_COLORS.length;
const MAX_BLOCK_SECONDS = 24 * 60 * 60;

export const createTimerSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Please give your timer a label.")
    .max(40, "Label must be 40 characters or fewer."),
  color: z.enum(ALLOWED_COLORS).optional(),
  intervals: z
    .array(
      z
        .number()
        .int()
        .positive("Each block must be longer than 0 seconds.")
        .max(MAX_BLOCK_SECONDS, "A block can be at most 24 hours."),
    )
    .min(1, "Add at least one time block!")
    .max(20, "A timer can have at most 20 blocks."),
});

export type CreateTimerInput = z.infer<typeof createTimerSchema>;

export type Timer = {
  id: string;
  label: string;
  color: TimerColor;
  intervals: number[];
  /** Total seconds; always the sum of `intervals`. */
  duration: number;
  createdAt: string;
};

export function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatShort(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/** Cumulative end times of each block, e.g. [60, 30] -> [60, 90]. */
export function checkpointsOf(intervals: number[]) {
  let total = 0;
  return intervals.map((i) => (total += i));
}
