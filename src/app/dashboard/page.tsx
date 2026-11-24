import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import TimerApp from "@/components/TimerApp";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard · MultiClock" };

export default function DashboardPage() {
  return (
    // Reading the session is request-time work, so it streams in behind Suspense.
    <Suspense
      fallback={
        <p className="h-dvh flexbox text-gray-500 animate-pulse">
          Initializing dashboard...
        </p>
      }>
      <AuthedApp />
    </Suspense>
  );
}

async function AuthedApp() {
  // Real check (proxy.ts only does an optimistic one): the user must still exist.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <TimerApp user={user} />;
}
