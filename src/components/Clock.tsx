"use client";

import { useTimerContext } from "./TimerProvider";
import { formatClock, type Timer } from "@/lib/timers";

const CENTER = 200;
const STROKE = 3;
const GAP = 11;
const MAX_RADIUS = 180;

export default function Clock() {
  const { timers, liveTimers, playAll, pauseAll } = useTimerContext();

  // Longest timer on the outermost ring.
  const sorted = [...timers].sort((a, b) => b.duration - a.duration);
  const live = (t: Timer) =>
    liveTimers[t.id] ?? { timeLeft: t.duration, isRunning: false };

  const isAnythingRunning = timers.some((t) => live(t).isRunning);
  const hasTimers = timers.length > 0;

  // The center shows whichever unfinished timer ends soonest, preferring running ones.
  const unfinished = timers
    .map((t) => ({ ...t, ...live(t) }))
    .filter((t) => t.timeLeft > 0);
  const pool = unfinished.some((t) => t.isRunning)
    ? unfinished.filter((t) => t.isRunning)
    : unfinished;
  const nextUp = pool.reduce<(typeof pool)[number] | null>(
    (best, t) => (!best || t.timeLeft < best.timeLeft ? t : best),
    null,
  );
  const centerColor = nextUp?.color ?? "#ffffff";
  const centerTime = nextUp?.timeLeft ?? 0;

  return (
    // The whole graphic is one play/pause-all button. It's sized as a
    // container so the center and its digits scale with the rings.
    <button
      type="button"
      onClick={isAnythingRunning ? pauseAll : playAll}
      disabled={!hasTimers}
      title={isAnythingRunning ? "Pause All" : "Play All"}
      aria-label={isAnythingRunning ? "Pause all timers" : "Play all timers"}
      // self-start + shrink-0: in the tall desktop column, flex would otherwise
      // stretch the button vertically and override aspect-square.
      className={`@container relative block self-start shrink-0 aspect-square w-52 sm:w-64 lg:w-full lg:max-w-100 rounded-full outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-white/30 ${
        hasTimers
          ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          : "cursor-default"
      }`}>
      <svg
        viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        className="-rotate-90 size-full"
        aria-hidden>
        {sorted.length === 0 && (
          <circle
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={STROKE}
            fill="transparent"
            r={MAX_RADIUS}
            cx={CENTER}
            cy={CENTER}
          />
        )}

        {sorted.map((timer, index) => {
          const { timeLeft, isRunning } = live(timer);
          const r = MAX_RADIUS - index * (STROKE + GAP);
          if (r <= 10) return null;

          const circumference = 2 * Math.PI * r;
          const offset =
            timer.duration > 0
              ? circumference - (timeLeft / timer.duration) * circumference
              : 0;

          return (
            <g key={timer.id}>
              <circle
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={STROKE}
                fill="transparent"
                r={r}
                cx={CENTER}
                cy={CENTER}
              />
              <circle
                stroke={timer.color}
                strokeWidth={STROKE}
                strokeDasharray={circumference}
                strokeLinecap="round"
                fill="transparent"
                r={r}
                cx={CENTER}
                cy={CENTER}
                style={{
                  strokeDashoffset: offset,
                  transition: isRunning
                    ? "stroke-dashoffset 1s linear"
                    : "stroke-dashoffset 0.8s ease-in-out",
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* The "black hole": 40% of the graphic, as the original 160px of 400px. */}
      <span className="absolute inset-[30%] flexbox rounded-full">
        <span
          className="absolute inset-0 rounded-full bg-black border border-white/5"
          style={{
            boxShadow:
              "inset 0 0 40px 15px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.5)",
          }}
        />
        <span
          className={`absolute inset-0 rounded-full transition-all duration-1000 blur-2xl ${
            isAnythingRunning ? "opacity-20" : "opacity-0"
          }`}
          style={{ backgroundColor: centerColor }}
        />
        {/* 12cqw = the original 48px digits at 400px wide. */}
        <span
          className={`relative z-10 text-[12cqw] leading-none font-light tracking-widest tabular-nums transition-all duration-500 doto-font ${
            isAnythingRunning ? "text-white" : "text-white/20"
          }`}>
          {formatClock(centerTime).replace(":", " ")}
        </span>
      </span>
    </button>
  );
}
