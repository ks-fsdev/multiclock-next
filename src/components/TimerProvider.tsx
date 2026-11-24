"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Timer } from "@/lib/timers";

export type LiveState = { timeLeft: number; isRunning: boolean };
type Controller = { play: () => void; pause: () => void };

type TimerContextValue = {
  timers: Timer[];
  setTimers: Dispatch<SetStateAction<Timer[]>>;
  removeTimer: (id: string) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  /** Each card's countdown, mirrored here so the clock can draw it. */
  liveTimers: Record<string, LiveState>;
  syncTimer: (id: string, state: LiveState) => void;
  /** Cards register play/pause so the clock can control them all at once. */
  registerController: (id: string, c: Controller) => () => void;
  playAll: () => void;
  pauseAll: () => void;
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [liveTimers, setLiveTimers] = useState<Record<string, LiveState>>({});
  const controllers = useRef(new Map<string, Controller>());

  // Stable and skips identical updates. Before, a new function on every
  // render meant each sync re-rendered the provider and synced again.
  const syncTimer = useCallback((id: string, next: LiveState) => {
    setLiveTimers((prev) => {
      const cur = prev[id];
      if (
        cur &&
        cur.timeLeft === next.timeLeft &&
        cur.isRunning === next.isRunning
      ) {
        return prev;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  // Also drops the timer's live state, which deletes used to leave behind.
  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
    setLiveTimers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const registerController = useCallback((id: string, c: Controller) => {
    controllers.current.set(id, c);
    return () => {
      controllers.current.delete(id);
    };
  }, []);

  const playAll = useCallback(() => {
    controllers.current.forEach((c) => c.play());
  }, []);
  const pauseAll = useCallback(() => {
    controllers.current.forEach((c) => c.pause());
  }, []);

  const value = useMemo(
    () => ({
      timers,
      setTimers,
      removeTimer,
      isFormOpen,
      setIsFormOpen,
      liveTimers,
      syncTimer,
      registerController,
      playAll,
      pauseAll,
    }),
    [
      timers,
      removeTimer,
      isFormOpen,
      liveTimers,
      syncTimer,
      registerController,
      playAll,
      pauseAll,
    ],
  );

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

export function useTimerContext() {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error("useTimerContext must be used inside <TimerProvider>");
  }
  return ctx;
}
