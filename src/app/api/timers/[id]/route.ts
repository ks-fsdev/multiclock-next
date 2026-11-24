import { collections } from "@/lib/firebase";
import { getUserId } from "@/lib/session";

// DELETE /api/timers/:id: only the owner may delete.
export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/timers/[id]">,
) {
  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const ref = collections.timers().doc(id);
    const doc = await ref.get();

    // 404 for both "missing" and "someone else's" so ids can't be probed.
    if (!doc.exists || doc.data()?.userId !== userId) {
      return Response.json({ error: "Timer not found." }, { status: 404 });
    }

    await ref.delete();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/timers/[id] failed:", error);
    return Response.json({ error: "Could not delete timer." }, { status: 500 });
  }
}
