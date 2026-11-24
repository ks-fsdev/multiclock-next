// Pure fixed-window rate limit logic: no I/O, so it can be unit tested.

export type WindowState = { count: number; windowStart: number };

export type LimitResult =
  | { ok: true; next: WindowState }
  | { ok: false; retryAfterSeconds: number };

export function applyLimit(
  state: WindowState | undefined,
  now: number,
  limit: number,
  windowMs: number,
): LimitResult {
  // No record, or the old window has expired: start a fresh one.
  if (!state || now - state.windowStart >= windowMs) {
    return { ok: true, next: { count: 1, windowStart: now } };
  }
  if (state.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((state.windowStart + windowMs - now) / 1000),
    };
  }
  return { ok: true, next: { count: state.count + 1, windowStart: state.windowStart } };
}
