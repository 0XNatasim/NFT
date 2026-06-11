import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getServiceClient();
    const [completed, open] = await Promise.all([
      db
        .from("trade_offers")
        .select("maker_mon_amount::text, taker_mon_amount::text", { count: "exact" })
        .eq("status", "completed"),
      db
        .from("trade_offers")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .eq("is_private", false),
    ]);
    if (completed.error) throw completed.error;
    if (open.error) throw open.error;

    let volume = 0n;
    for (const row of completed.data ?? []) {
      volume += BigInt(row.maker_mon_amount ?? 0) + BigInt(row.taker_mon_amount ?? 0);
    }

    return NextResponse.json({
      totalTrades: completed.count ?? 0,
      openOffers: open.count ?? 0,
      totalVolumeWei: volume.toString(),
    });
  } catch (err) {
    console.error("GET /api/stats failed:", err);
    return NextResponse.json(
      { totalTrades: 0, openOffers: 0, totalVolumeWei: "0" },
      { status: 200 }
    );
  }
}
