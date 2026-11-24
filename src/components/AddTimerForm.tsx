"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useTimerContext } from "./TimerProvider";
import {
  ALLOWED_COLORS,
  MAX_TIMERS,
  createTimerSchema,
  formatShort,
  type Timer,
  type TimerColor,
} from "@/lib/timers";

export default function AddTimerForm({ onDone }: { onDone: () => void }) {
  const { timers, setTimers } = useTimerContext();

  const usedColors = new Set(timers.map((t) => t.color));
  const firstFree = ALLOWED_COLORS.find((c) => !usedColors.has(c));

  const [label, setLabel] = useState("");
  const [color, setColor] = useState<TimerColor | undefined>(firstFree);
  const [intervals, setIntervals] = useState<number[]>([]);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [saving, setSaving] = useState(false);

  const total = intervals.reduce((a, b) => a + b, 0);
  const atLimit = timers.length >= MAX_TIMERS;

  const addInterval = () => {
    const secs =
      (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
    if (secs <= 0) {
      toast.error("Enter a valid time!");
      return;
    }
    setIntervals((prev) => [...prev, secs]);
    setMinutes("");
    setSeconds("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // The same schema the API uses, so the errors match.
    const parsed = createTimerSchema.safeParse({ label, color, intervals });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/timers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);

      setTimers((prev) => [body.timer as Timer, ...prev]);
      toast.success("Timer locked in!");
      onDone();
    } catch (error) {
      toast.error(`Error saving: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (atLimit) {
    return (
      <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl text-center">
        <h2 className="text-xl font-bold text-white mb-2">All rings in use</h2>
        <p className="text-sm text-gray-400">
          You can run up to {MAX_TIMERS} timers, one per color. Delete one to
          add another.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-6 w-full max-w-md mx-auto shadow-2xl max-h-[85vh] overflow-y-auto touch-no-scrollbar">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 tracking-tight text-white">
        New Timer
      </h2>

      <div className="space-y-6">
        <div>
          <label htmlFor="timer-label" className="field-label mb-2">
            Label
          </label>
          <input
            id="timer-label"
            type="text"
            autoFocus
            maxLength={40}
            placeholder="e.g., Sprint, Meditation..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="field-input focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <fieldset>
          <legend className="field-label mb-3">Theme Color</legend>
          <div className="flex flex-wrap gap-3">
            {ALLOWED_COLORS.map((c) => {
              const isUsed = usedColors.has(c);
              const isSelected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  disabled={isUsed}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}${isUsed ? " (in use)" : ""}`}
                  aria-pressed={isSelected}
                  style={{ backgroundColor: c }}
                  className={`w-9 h-9 rounded-full transition-all flexbox ${
                    isUsed
                      ? "opacity-20 cursor-not-allowed scale-90"
                      : isSelected
                        ? "ring-2 ring-white ring-offset-4 ring-offset-[#181818] scale-110"
                        : "hover:scale-110 cursor-pointer shadow-lg"
                  }`}>
                  {isUsed && <span className="text-[10px] text-black">✕</span>}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="pt-6 border-t border-white/5">
          <span className="field-label mb-3">Add Time Blocks</span>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 grid grid-cols-2 gap-2">
              {(
                [
                  ["Min", "M", minutes, setMinutes],
                  ["Sec", "S", seconds, setSeconds],
                ] as const
              ).map(([placeholder, unit, value, set]) => (
                <div key={unit} className="relative">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder={placeholder}
                    aria-label={placeholder === "Min" ? "Minutes" : "Seconds"}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInterval();
                      }
                    }}
                    className="field-input px-3 focus:ring-1 focus:ring-white/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold uppercase pointer-events-none">
                    {unit}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addInterval}
              className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-sm font-bold transition-all cursor-pointer">
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-10">
            {intervals.map((time, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setIntervals((prev) => prev.filter((_, i) => i !== idx))
                }
                aria-label={`Remove ${formatShort(time)} block`}
                className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center gap-2 group cursor-pointer">
                {formatShort(time)}
                <span className="opacity-40 group-hover:opacity-100 text-[10px]">
                  ✕
                </span>
              </button>
            ))}
            {intervals.length === 0 && (
              <p className="text-xs text-gray-600 italic">No blocks added yet...</p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Total Run Time
            </span>
            <span className="text-lg font-black text-white tabular-nums">
              {formatShort(total)}
            </span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-wait">
            {saving ? "SAVING..." : "SAVE & LAUNCH"}
          </button>
        </div>
      </div>
    </form>
  );
}
