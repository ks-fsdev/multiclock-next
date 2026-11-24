"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";

type Mode = "login" | "signup";

const copy = {
  login: {
    title: "Welcome back",
    submit: "Log In",
    pending: "Logging in...",
    switchText: "New here?",
    switchLink: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    submit: "Get Started",
    pending: "Creating account...",
    switchText: "Already have an account?",
    switchLink: "Log in",
    switchHref: "/login",
  },
} as const;

export default function AuthForm({ mode }: { mode: Mode }) {
  const [state, action, pending] = useActionState(
    mode === "login" ? login : signup,
    undefined,
  );
  const t = copy[mode];

  return (
    <div className="w-full max-w-sm bg-[#181818] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
      <h1 className="text-2xl font-bold tracking-tight text-white mb-6">
        {t.title}
      </h1>

      <form action={action} className="space-y-4" noValidate>
        {mode === "signup" && (
          <Field
            name="name"
            label="Name"
            autoComplete="name"
            defaultValue={state?.values?.name}
            errors={state?.errors?.name}
          />
        )}
        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          errors={state?.errors?.email}
        />
        <Field
          name="password"
          label="Password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          errors={state?.errors?.password}
          hint={
            mode === "signup"
              ? "At least 8 characters, with a letter and a number."
              : undefined
          }
        />

        {state?.message && (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait">
          {pending ? t.pending : t.submit}
        </button>
      </form>

      <p className="text-sm text-gray-400 mt-6 text-center">
        {t.switchText}{" "}
        <Link href={t.switchHref} className="text-white hover:text-gray-400 font-medium">
          {t.switchLink}
        </Link>
      </p>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  errors,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  errors?: string[];
  hint?: string;
}) {
  const id = `auth-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label mb-2">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={!!errors?.length}
        aria-describedby={errors?.length || hint ? `${id}-desc` : undefined}
        className="field-input focus:ring-2 focus:ring-indigo-500/50 aria-invalid:border-red-500/60"
      />
      {(errors?.length || hint) && (
        <p
          id={`${id}-desc`}
          className={`text-xs mt-1.5 ${errors?.length ? "text-red-400" : "text-gray-500"}`}>
          {errors?.[0] ?? hint}
        </p>
      )}
    </div>
  );
}
