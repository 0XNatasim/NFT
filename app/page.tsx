"use client";

import Link from "next/link";
import { ArrowRight, Handshake, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/trade/offer-card";
import { EmptyState } from "@/components/empty-state";
import { useMarketStats, useOffers } from "@/hooks/use-market";
import { formatMon } from "@/lib/utils";

export default function HomePage() {
  const { data: openOffers, isLoading: loadingOpen } = useOffers({
    status: "open",
    limit: 12,
  });
  const { data: recentTrades, isLoading: loadingRecent } = useOffers({
    status: "completed",
    limit: 6,
  });
  const { data: stats } = useMarketStats();

  return (
    <div className="container mx-auto px-4">
      {/* Hero */}
      <section className="py-16 text-center md:py-24">
        <h1 className="text-balance mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Every trade is a <span className="text-monad-purple">handshake</span>.
          Human to human.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Deal NFTs directly with another wallet on Monad — no bots, no snipers,
          no middleman. You set the terms, they shake on it, and the contract
          settles it atomically. Zero custody.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/create"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create a trade <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/wanted"
            className="inline-flex h-12 items-center rounded-md bg-secondary px-8 text-base font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Browse wanted board
          </Link>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4">
          <Stat label="Trades settled" value={String(stats?.totalTrades ?? "—")} />
          <Stat label="Open offers" value={String(stats?.openOffers ?? "—")} />
          <Stat
            label="MON volume"
            value={stats ? formatMon(BigInt(stats.totalVolumeWei)) : "—"}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border py-14">
        <h2 className="mb-8 text-center text-2xl font-semibold">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <HowCard
            icon={<Handshake className="h-6 w-6 text-monad-purple" />}
            title="1. Build your offer"
            body="Pick NFTs and MON from both sides of the trade. Target a specific wallet or open it to everyone. Signing is free — no gas to list."
          />
          <HowCard
            icon={<ShieldCheck className="h-6 w-6 text-monad-purple" />}
            title="2. Counterparty accepts"
            body="The taker reviews exactly what moves on both sides, including the fee breakdown, then accepts in their wallet."
          />
          <HowCard
            icon={<Zap className="h-6 w-6 text-monad-purple" />}
            title="3. Atomic settlement"
            body="One transaction swaps everything or nothing. No escrow middlemen, no platform custody — the contract verifies signatures, ownership and approvals."
          />
        </div>
      </section>

      {/* Marketplace feed */}
      <section className="border-t border-border py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Open trade offers</h2>
          <Link href="/create" className="text-sm text-monad-purple hover:underline">
            Create yours →
          </Link>
        </div>
        {loadingOpen ? (
          <OfferGridSkeleton />
        ) : openOffers && openOffers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {openOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No open offers yet"
            body="Be the first to put a trade on the board."
          />
        )}
      </section>

      {/* Recent trades */}
      <section className="border-t border-border py-14">
        <h2 className="mb-6 text-2xl font-semibold">Recent trades</h2>
        {loadingRecent ? (
          <OfferGridSkeleton />
        ) : recentTrades && recentTrades.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentTrades.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No trades settled yet"
            body="Completed trades will show up here."
          />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold text-monad-purple">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function HowCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-3">{icon}</div>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function OfferGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}
