"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTimerContext } from "./TimerProvider";
import TimerCard from "./TimerCard";
import type { Timer } from "@/lib/timers";

export default function Dashboard() {
  const { timers, setTimers, setIsFormOpen } = useTimerContext();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // Load once. New and deleted timers update local state directly,
  // so there's no refetch every time the form closes.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/timers")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data: { timers: Timer[] } = await res.json();
        if (!cancelled) {
          setTimers(data.timers);
          setStatus("ready");
        }
      })
      .catch((error) => {
        console.error("Error fetching timers:", error);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [setTimers, router]);

  if (status === "loading") {
    return (
      <p className="text-gray-500 text-center mt-8 animate-pulse">
        Initializing dashboard...
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-red-400/80 text-center mt-8">
        Couldn&apos;t load your timers. Refresh to try again.
      </p>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto lg:px-6 pb-12">
      {/* List on small screens, the two-column card grid from lg up. */}
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-6">
        {timers.map((timer) => (
          <TimerCard key={timer.id} timer={timer} />
        ))}

        {timers.length === 0 && (
          <>
            {/* Empty state as a list row (small screens). */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="lg:hidden text-left border-2 border-dashed border-white/10 rounded-lg px-3 pt-2 pb-2.5 sm:px-4 cursor-pointer hover:border-white/30 hover:bg-white/2 transition-all group">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full border border-gray-600/70 group-hover:border-gray-400 transition-colors shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-500 group-hover:text-gray-300 transition-colors">
                    Add a timer
                  </h4>
                  <p className="text-[11px] text-gray-600 uppercase tracking-wider">
                    Ready for configuration
                  </p>
                </div>
                <span className="text-xl sm:text-2xl font-light tabular-nums tracking-widest doto-font text-white/10 group-hover:text-white/30 transition-colors shrink-0">
                  00 00
                </span>
                <span className="bg-white/5 border border-dashed border-white/10 text-gray-500 px-2.5 py-1 rounded-md text-xs font-bold group-hover:bg-white/10 group-hover:text-white transition-colors shrink-0">
                  + Configure
                </span>
              </div>
            </button>

            {/* Empty state as the "ghost" card (large screens). */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="hidden lg:flex text-left bg-[#181818] border-2 border-dashed border-white/10 rounded-2xl p-6 flex-col cursor-pointer hover:border-white/30 hover:bg-[#202020] transition-all group">
              <div className="flex justify-between items-start mb-4 w-full">
                <div>
                  <h3 className="text-xl font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
                    Add a timer
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">Ready for configuration</p>
                </div>
                <div className="w-4 h-4 rounded-full border border-gray-600/70 group-hover:border-gray-400 transition-colors" />
              </div>

              <div className="text-5xl font-light tracking-widest tabular-nums text-white/10 doto-font group-hover:text-white/30 transition-colors">
                00 00
              </div>

              <div className="flex gap-1 mt-3 h-1.5 w-full rounded-full bg-white/5" />

              <div className="flex flex-wrap gap-3 mt-6 w-full">
                <div className="bg-white/5 border border-dashed border-white/10 text-gray-500 px-4 py-2 rounded-lg text-sm font-bold text-center group-hover:bg-white/10 group-hover:text-white transition-colors">
                  + Configure
                </div>
                <div className="border border-dashed border-white/5 px-4 py-2 rounded-lg text-sm text-transparent select-none">
                  ↺
                </div>
                <div className="border border-dashed border-white/5 px-4 py-2 rounded-lg text-sm text-transparent select-none">
                  ✕
                </div>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
