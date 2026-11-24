import { z } from "zod";

// Normalize first, then validate, so pasted emails with stray spaces pass.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name must be 50 characters or fewer."),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    // bcrypt only uses the first 72 bytes.
    .max(72, "Password must be 72 characters or fewer.")
    .regex(/[a-zA-Z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number."),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export type AuthFormState =
  | {
      errors?: Partial<Record<"name" | "email" | "password", string[]>>;
      message?: string;
      values?: { name?: string; email?: string };
    }
  | undefined;
