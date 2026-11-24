import { z } from "zod";
import { collections } from "@/lib/firebase";
import { getUserId } from "@/lib/session";
import {
  ALLOWED_COLORS,
  MAX_TIMERS,
  createTimerSchema,
  type Timer,
} from "@/lib/timers";

const unauthorized = () =>
  Response.json({ error: "Not signed in." }, { status: 401 });

// GET /api/timers: the signed-in user's timers, newest first.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  try {
    const snap = await collections
      .timers()
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const timers: Timer[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        label: d.label,
        color: d.color,
        intervals: d.intervals ?? [],
        duration: d.duration,
        createdAt: d.createdAt,
      };
    });
    return Response.json({ timers });
  } catch (error) {
    console.error("GET /api/timers failed:", error);
    return Response.json({ error: "Could not load timers." }, { status: 500 });
  }
}

// POST /api/timers: create a timer. Duration is computed here, never trusted from the client.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createTimerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid timer.",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const { label, intervals } = parsed.data;

  try {
    const used = await collections
      .timers()
      .where("userId", "==", userId)
      .select("color")
      .get();

    // Each timer owns one ring color, which also caps how many a user can have.
    if (used.size >= MAX_TIMERS) {
      return Response.json(
        { error: `You can have at most ${MAX_TIMERS} timers.` },
        { status: 409 },
      );
    }

    const usedColors = new Set(used.docs.map((d) => d.data().color));
    const color =
      parsed.data.color && !usedColors.has(parsed.data.color)
        ? parsed.data.color
        : ALLOWED_COLORS.find((c) => !usedColors.has(c))!;

    const data = {
      label,
      color,
      intervals,
      duration: intervals.reduce((a, b) => a + b, 0),
      createdAt: new Date().toISOString(),
    };
    const ref = await collections.timers().add({ ...data, userId });

    const timer: Timer = { id: ref.id, ...data };
    return Response.json({ timer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/timers failed:", error);
    return Response.json({ error: "Could not save timer." }, { status: 500 });
  }
}
