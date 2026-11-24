// Countdown math, kept pure so it can be tested without a browser.

/** Whole seconds left until `endsAt`, rounded up (a 0.2s remainder still shows 1). */
export function remainingSeconds(endsAt: number, now: number) {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/**
 * True if any checkpoint falls in (prevElapsed, elapsed]. Measuring the span
 * between ticks, not just the current second, means a checkpoint still fires
 * once when a throttled tab skips several seconds at a time.
 */
export function crossedCheckpoint(
  checkpoints: number[],
  prevElapsed: number,
  elapsed: number,
) {
  return checkpoints.some((cp) => cp > prevElapsed && cp <= elapsed);
}

/** Fill percentage (0-100) of each block's progress bar. */
export function blockFill(intervals: number[], checkpoints: number[], elapsed: number) {
  return intervals.map((interval, idx) => {
    const end = checkpoints[idx];
    const start = idx === 0 ? 0 : checkpoints[idx - 1];
    if (elapsed >= end) return 100;
    if (elapsed > start) return ((elapsed - start) / interval) * 100;
    return 0;
  });
}
