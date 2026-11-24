"use server";

import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { collections, getDb } from "@/lib/firebase";
import { createSession, deleteSession } from "@/lib/session";
import { RULES, clientIp, hit, reset, tooManyMessage } from "@/lib/rate-limit";
import {
  loginSchema,
  signupSchema,
  type AuthFormState,
} from "@/lib/auth-schemas";

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so login takes the same time
// whether or not the account exists (no user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("multiclock-timing-guard", BCRYPT_ROUNDS);

class EmailTakenError extends Error {}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { name, email, password } = parsed.data;

  try {
    const limited = await hit(RULES.signupPerIp, await clientIp());
    if (!limited.ok) {
      return { message: tooManyMessage(limited.retryAfterSeconds), values };
    }
  } catch (error) {
    console.error("Signup rate limit failed:", error);
    return { message: "Something went wrong. Please try again.", values };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userRef = collections.users().doc();
  // One doc per email (keyed by its hash) makes uniqueness atomic: two
  // signups racing on the same email contend on the same document.
  const emailRef = getDb()
    .collection("userEmails")
    .doc(createHash("sha256").update(email).digest("hex"));

  try {
    await getDb().runTransaction(async (tx) => {
      const existing = await tx.get(emailRef);
      if (existing.exists) throw new EmailTakenError();
      tx.create(emailRef, { userId: userRef.id });
      tx.create(userRef, {
        name,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      });
    });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return {
        errors: { email: ["An account with this email already exists."] },
        values,
      };
    }
    console.error("Signup failed:", error);
    return { message: "Something went wrong. Please try again.", values };
  }

  await createSession(userRef.id);
  redirect("/dashboard");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = { email: String(formData.get("email") ?? "") };

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { email, password } = parsed.data;
  let userId: string | null = null;

  try {
    // Per-IP stops one client spraying many accounts; per-email stops
    // guessing one account's password from many IPs.
    for (const [rule, key] of [
      [RULES.loginPerIp, await clientIp()],
      [RULES.loginPerEmail, email],
    ] as const) {
      const limited = await hit(rule, key);
      if (!limited.ok) {
        return { message: tooManyMessage(limited.retryAfterSeconds), values };
      }
    }

    const snap = await collections
      .users()
      .where("email", "==", email)
      .limit(1)
      .get();
    const user = snap.docs[0];
    const ok = await bcrypt.compare(
      password,
      user?.data().passwordHash ?? DUMMY_HASH,
    );
    if (user && ok) {
      userId = user.id;
      await reset(RULES.loginPerEmail, email);
    }
  } catch (error) {
    console.error("Login failed:", error);
    return { message: "Something went wrong. Please try again.", values };
  }

  if (!userId) {
    // Same message for unknown email and wrong password.
    return { message: "Invalid email or password.", values };
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
