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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {timers.map((timer) => (
          <TimerCard key={timer.id} timer={timer} />
        ))}

        {timers.length === 0 && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="text-left bg-[#181818] border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col cursor-pointer hover:border-white/30 hover:bg-[#202020] transition-all group">
            <div className="flex justify-between items-start mb-4 w-full">
              <div>
                <h3 className="text-xl font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
                  Add a timer
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Ready for configuration
                </p>
              </div>
              <div className="w-4 h-4 rounded-full border border-gray-600/70 group-hover:border-gray-400 transition-colors" />
            </div>

            <div className="text-5xl font-light tracking-widest tabular-nums text-white/10 doto-font group-hover:text-white/30 transition-colors">
              00 00
            </div>

            <div className="flex gap-1 mt-3 h-1.5 w-full rounded-full bg-white/5" />

            <div className="flex flex-wrap gap-2 sm:gap-3 mt-6 w-full">
              <div className="bg-white/5 border border-dashed border-white/10 text-gray-500 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-bold flex-1 sm:flex-none text-center group-hover:bg-white/10 group-hover:text-white transition-colors">
                + Configure
              </div>
              <div className="border border-dashed border-white/5 px-4 py-2.5 sm:py-2 rounded-lg text-sm text-transparent select-none">
                ↺
              </div>
              <div className="border border-dashed border-white/5 px-4 py-2.5 sm:py-2 rounded-lg text-sm text-transparent select-none">
                ✕
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
