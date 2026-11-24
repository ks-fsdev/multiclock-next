"use client";

import Image from "next/image";
import { ClockPlus, LogOut } from "lucide-react";
import { useTimerContext } from "./TimerProvider";
import { logout } from "@/app/actions/auth";
import type { PublicUser } from "@/lib/session";

export default function Navbar({ user }: { user: PublicUser }) {
  const { isFormOpen, setIsFormOpen } = useTimerContext();
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <nav className="glass-panel fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt=""
          width={24}
          height={24}
          className="animate-pulse"
          priority
        />
        <span className="text-lg font-bold tracking-tight text-white hidden md:inline-block">
          Multi<span className="text-indigo-400">Clock</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsFormOpen(true)}
          aria-label="Add timer"
          title="Add timer"
          className={`text-white hover:text-black p-2 rounded-lg hover:bg-gray-200 transition-all cursor-pointer ${
            isFormOpen ? "opacity-0" : "opacity-100"
          }`}>
          <ClockPlus />
        </button>

        <div
          className="h-9 w-9 rounded-full ring-2 ring-indigo-500/50 bg-white/10 flexbox font-bold text-sm select-none"
          title={`${user.name} (${user.email})`}>
          {initial}
        </div>

        <form action={logout}>
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
            <LogOut className="size-5" />
          </button>
        </form>
      </div>
    </nav>
  );
}
