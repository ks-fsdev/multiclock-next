import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh px-6 py-16 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 sm:w-150 sm:h-150 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      <Link href="/" className="relative flex items-center gap-2">
        <Image src="/logo.png" alt="" width={28} height={28} priority />
        <span className="text-xl font-bold tracking-tight">
          Multi<span className="text-indigo-400">Clock</span>
        </span>
      </Link>
      <div className="relative w-full flex justify-center">{children}</div>
    </main>
  );
}
