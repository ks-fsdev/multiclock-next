"use client";

import { useEffect } from "react";
import { TimerProvider, useTimerContext } from "./TimerProvider";
import Navbar from "./Navbar";
import Clock from "./Clock";
import Dashboard from "./Dashboard";
import AddTimerForm from "./AddTimerForm";
import type { PublicUser } from "@/lib/session";

export default function TimerApp({ user }: { user: PublicUser }) {
  return (
    <TimerProvider>
      <Shell user={user} />
    </TimerProvider>
  );
}

function Shell({ user }: { user: PublicUser }) {
  const { isFormOpen, setIsFormOpen } = useTimerContext();

  useEffect(() => {
    if (!isFormOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsFormOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFormOpen, setIsFormOpen]);

  return (
    <div className="h-dvh pt-24 px-6 flex flex-col items-center overflow-hidden">
      <Navbar user={user} />

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 flex-1 min-h-0 mt-4">
        <div className="lg:col-span-1 w-full flex justify-center shrink-0 lg:pt-10">
          <Clock />
        </div>

        <div className="lg:col-span-2 w-full flex-1 min-h-0 flex flex-col pr-2">
          <h3 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-3 shrink-0 mt-4 lg:mt-0">
            Dashboard
          </h3>
          <div className="flex-1 overflow-y-auto touch-no-scrollbar pb-20">
            <Dashboard />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New timer"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flexbox p-4"
          onClick={(e) => e.target === e.currentTarget && setIsFormOpen(false)}>
          <div className="relative w-full max-w-md mt-8">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute -top-12 right-0 text-white/50 hover:text-white text-xl p-2 cursor-pointer transition-colors">
              ✕ <span className="hidden lg:inline-block">Close</span>
            </button>
            <AddTimerForm onDone={() => setIsFormOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
