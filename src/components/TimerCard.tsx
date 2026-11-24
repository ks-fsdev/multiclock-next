"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTimerContext } from "./TimerProvider";
import { playAlarm, stopAlarms } from "@/lib/alarms";
import { checkpointsOf, formatClock, type Timer } from "@/lib/timers";
import { blockFill, crossedCheckpoint, remainingSeconds } from "@/lib/countdown";

function showAlarmToast(label: string, isFinal: boolean) {
  playAlarm(isFinal ? "final" : "checkpoint");
  const id = toast(
    (t) => (
      <div className="flex flex-col gap-3 min-w-50">
        <span className="font-bold text-white">
          {isFinal ? "Timer Complete!" : "Checkpoint Reached!"}
        </span>
        <p className="text-xs text-gray-400">
          {isFinal
            ? `You've finished "${label}".`
            : `Moving to the next block in "${label}".`}
        </p>
        <button
          onClick={() => {
            stopAlarms();
            toast.dismiss(t.id);
          }}
          className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer">
          ACKNOWLEDGE
        </button>
      </div>
    ),
    {
      duration: isFinal ? Infinity : 10_000,
      position: "top-center",
      className: "bg-[#181818]! border border-white/10 p-4 rounded-2xl shadow-2xl",
    },
  );

  // A checkpoint alarm stops on its own when its toast times out.
  if (!isFinal) {
    setTimeout(() => {
      stopAlarms();
      toast.dismiss(id);
    }, 10_000);
  }
}

export default function TimerCard({ timer }: { timer: Timer }) {
  const { removeTimer, syncTimer, registerController } = useTimerContext();

  const [timeLeft, setTimeLeft] = useState(timer.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // The deadline is a wall-clock timestamp, so throttled background tabs
  // don't drift: each tick recomputes the remaining time from the clock.
  const endsAt = useRef<number | null>(null);
  const lastLeft = useRef(timer.duration);

  const checkpoints = checkpointsOf(timer.intervals);
  const isSingleInterval = timer.intervals.length <= 1;

  const start = () => {
    if (lastLeft.current <= 0) return;
    endsAt.current = Date.now() + lastLeft.current * 1000;
    setIsRunning(true);
  };

  const pause = () => {
    endsAt.current = null;
    setIsRunning(false);
  };

  const reset = () => {
    pause();
    stopAlarms();
    lastLeft.current = timer.duration;
    setTimeLeft(timer.duration);
  };

  const tick = useEffectEvent(() => {
    if (endsAt.current === null) return;
    const left = remainingSeconds(endsAt.current, Date.now());
    if (left === lastLeft.current) return;

    const prevElapsed = timer.duration - lastLeft.current;
    const elapsed = timer.duration - left;
    lastLeft.current = left;
    setTimeLeft(left);

    if (left === 0) {
      pause();
      showAlarmToast(timer.label, true);
      return;
    }
    // Fires once even if several seconds passed while the tab was asleep.
    if (crossedCheckpoint(checkpoints, prevElapsed, elapsed)) {
      showAlarmToast(timer.label, false);
    }
  });

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isRunning]);

  // Let the clock's center button play/pause every card.
  const control = useEffectEvent((action: "play" | "pause") =>
    action === "play" ? start() : pause(),
  );
  useEffect(
    () =>
      registerController(timer.id, {
        play: () => control("play"),
        pause: () => control("pause"),
      }),
    [timer.id, registerController],
  );

  useEffect(() => {
    syncTimer(timer.id, { timeLeft, isRunning });
  }, [timer.id, timeLeft, isRunning, syncTimer]);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/timers/${timer.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      pause();
      removeTimer(timer.id);
      toast.success("Timer Deleted!", { id: "delete-success", duration: 2000 });
    } catch (error) {
      toast.error(`Error deleting: ${(error as Error).message}`);
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    toast(
      (t) => (
        <div className="min-w-50">
          <p className="text-white mb-3">
            Delete <span className="font-semibold capitalize">{timer.label}</span>?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                void confirmDelete();
              }}
              className="bg-[#ff4b4b] text-white px-3 py-1 rounded cursor-pointer w-full font-bold">
              Confirm
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-[#333] text-white px-3 py-1 rounded cursor-pointer w-full">
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 10_000, id: "delete-confirmation" },
    );
  };

  const elapsed = timer.duration - timeLeft;
  const nextCheckpoint = checkpoints.find((cp) => cp > elapsed);
  const untilCheckpoint = nextCheckpoint ? nextCheckpoint - elapsed : 0;

  return (
    <div
      className={`p-5 rounded-2xl border transition-all relative ${
        isRunning
          ? "bg-neutral-900 border-white/40 shadow-lg"
          : "bg-black/40 border-white/10 hover:border-white/20"
      } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-lg flex items-center gap-2 capitalize">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor: timer.color,
                boxShadow: isRunning ? `0 0 10px ${timer.color}` : "none",
              }}
            />
            <span className="truncate">{timer.label}</span>
          </h4>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
            Total: {formatClock(timer.duration)}
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3 shrink-0">
          {timeLeft > 0 && (
            <button
              onClick={isRunning ? pause : start}
              aria-label={isRunning ? "Pause" : "Play"}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all cursor-pointer">
              {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
          )}
          <button
            onClick={reset}
            aria-label="Reset"
            title="Reset"
            className="bg-white/5 hover:bg-white/20 text-gray-300 px-3 py-2 rounded-lg transition-all cursor-pointer">
            <RotateCcw className="size-4" />
          </button>
          <button
            onClick={handleDelete}
            aria-label="Delete timer"
            title="Delete Timer"
            className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 px-3 py-2 rounded-lg transition-all cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 text-4xl font-extrabold tabular-nums tracking-tighter">
        {formatClock(timeLeft)}
      </div>

      <div className="bg-black/50 rounded-lg p-3 border border-white/5">
        {timeLeft === 0 ? (
          <p className="text-sm font-semibold text-green-400">Timer Complete!</p>
        ) : untilCheckpoint > 0 && !isSingleInterval ? (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Next checkpoint in:</span>
            <span className="font-mono font-bold text-indigo-300">
              {formatClock(untilCheckpoint)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No upcoming checkpoints</p>
        )}

        <div className="flex gap-1 mt-3 h-1.5 w-full rounded-full overflow-hidden">
          {blockFill(timer.intervals, checkpoints, elapsed).map((fill, idx) => {
            return (
              <div
                key={idx}
                className="h-full flex-1 bg-white/20 relative overflow-hidden rounded-full">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${fill}%`, backgroundColor: timer.color }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
