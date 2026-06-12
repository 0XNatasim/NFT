"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import type { TradeOffer } from "@/lib/types";

const SEEN_KEY = "monad-market-seen-offers";

function getSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function markSeen(ids: string[]) {
  try {
    const seen = getSeen();
    ids.forEach((id) => seen.add(id));
    // keep the list bounded
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    // localStorage unavailable; alerts just stay highlighted
  }
}

/**
 * Header bell: polls for open offers reserved for the connected wallet
 * and shows how many are unseen. Viewing the account page marks them seen.
 */
export function OfferAlerts() {
  const { address } = useAccount();
  const pathname = usePathname();

  const { data: incoming } = useQuery({
    queryKey: ["incoming-offers", address],
    enabled: !!address,
    refetchInterval: 30_000,
    queryFn: async (): Promise<TradeOffer[]> => {
      const res = await fetch(`/api/offers?taker=${address}&status=open&limit=50`);
      if (!res.ok) return [];
      const { offers } = await res.json();
      return (offers as TradeOffer[]).filter(
        (o) => o.makerAddress.toLowerCase() !== address!.toLowerCase()
      );
    },
  });

  const unseenCount = useMemo(() => {
    if (!incoming || incoming.length === 0) return 0;
    const seen = typeof window !== "undefined" ? getSeen() : new Set();
    return incoming.filter((o) => !seen.has(o.id)).length;
  }, [incoming]);

  // Visiting the account page counts as "seen".
  useEffect(() => {
    if (pathname === "/account" && incoming && incoming.length > 0) {
      markSeen(incoming.map((o) => o.id));
    }
  }, [pathname, incoming]);

  if (!address) return null;

  return (
    <Link
      href="/account"
      aria-label={
        unseenCount > 0
          ? `${unseenCount} new trade offers for your wallet`
          : "Trade offer notifications"
      }
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Bell className="h-5 w-5" />
      {unseenCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-monad-purple px-1 text-[10px] font-bold text-monad-black">
          {unseenCount > 9 ? "9+" : unseenCount}
        </span>
      )}
    </Link>
  );
}
