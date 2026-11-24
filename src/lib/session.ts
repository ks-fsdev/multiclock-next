import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { collections } from "./firebase";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
} from "./session-token";

export async function createSession(userId: string) {
  const token = await signSession({ userId });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in user's id, or null. Deduped per request. */
export const getUserId = cache(async (): Promise<string | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  return session?.userId ?? null;
});

export type PublicUser = { id: string; name: string; email: string };

/** The signed-in user, or null if the session is missing or the user was deleted. */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  const doc = await collections.users().doc(userId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  // Only expose safe fields; never the password hash.
  return { id: doc.id, name: data.name, email: data.email };
});
