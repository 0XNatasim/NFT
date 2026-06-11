import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";
import { addressSchema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const deleteSchema = z.object({ walletAddress: addressSchema });

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed } = rateLimit(clientKey(req, "wanted-delete"), 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("wanted_posts")
      .delete()
      .eq("id", id)
      .eq("wallet_address", parsed.data.walletAddress.toLowerCase())
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Post not found or not yours" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/wanted/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
