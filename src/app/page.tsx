import Link from "next/link";

// Signed-in visitors are redirected to /dashboard by proxy.ts, so this stays static.
export default function Landing() {
  return (
    <main className="h-dvh px-6 flexbox relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 sm:w-150 sm:h-150 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl flex flex-col items-center">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-gray-500 mb-6 pb-1">
          Master Your Time.
        </h1>

        <p className="text-base sm:text-xl text-gray-400 font-light tracking-wide mb-12 max-w-xl mx-auto">
          The only multi-timer app that lets you bifurcate time like a pro.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto">
          <Link
            href="/signup"
            className="intro-button bg-white text-black font-bold text-sm hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Get Started
          </Link>
          <Link
            href="/login"
            className="intro-button border border-white/20 text-white font-medium text-sm hover:bg-white/10 hover:border-white/40 transition-all">
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
