"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Handshake, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/trade/offer-card";
import { EmptyState } from "@/components/empty-state";
import { useMarketStats, useOffers } from "@/hooks/use-market";
import { FEATURED_COLLECTIONS, type FeaturedCollection } from "@/lib/featured-collections";
import { formatMon } from "@/lib/utils";

export default function HomePage() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const activeCollection = FEATURED_COLLECTIONS.find(
    (collection) => collection.address.toLowerCase() === selectedCollection
  );
  const { data: openOffers, isLoading: loadingOpen } = useOffers({
    status: "open",
    collection: selectedCollection ?? undefined,
    limit: 100,
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
          Trade NFTs <span className="text-monad-purple">wallet-to-wallet</span> on
          Monad
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          A trading desk, not a sniping ground. NFT-for-NFT, NFT+MON, private
          offers — settled atomically on-chain with zero custody.
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
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-monad-purple/30 bg-monad-purple/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-monad-purple">
              <Sparkles className="h-3.5 w-3.5" /> Market
            </p>
            <h2 className="text-2xl font-semibold">Open trade offers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter by Monad collection so hundreds of offers stay easy to scan.
            </p>
          </div>
          <Link href="/create" className="text-sm text-monad-purple hover:underline">
            Create yours →
          </Link>
        </div>

        <CollectionFilterBanner
          selectedCollection={selectedCollection}
          onSelect={setSelectedCollection}
        />

        <div className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {activeCollection
              ? `Showing ${activeCollection.name} offers`
              : "Showing all featured collection offers"}
          </span>
          {selectedCollection && (
            <button
              type="button"
              className="text-monad-purple hover:underline"
              onClick={() => setSelectedCollection(null)}
            >
              Clear filter
            </button>
          )}
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
            title={
              activeCollection
                ? `No ${activeCollection.name} offers yet`
                : "No open offers yet"
            }
            body={
              activeCollection
                ? "Clear the filter or create the first offer for this collection."
                : "Be the first to put a trade on the board."
            }
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

function CollectionFilterBanner({
  selectedCollection,
  onSelect,
}: {
  selectedCollection: string | null;
  onSelect: (collection: string | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3 shadow-sm">
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex min-w-28 shrink-0 flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${
            selectedCollection === null
              ? "border-monad-purple bg-monad-purple/15 text-foreground"
              : "border-border bg-secondary/40 text-muted-foreground hover:border-monad-purple/50 hover:text-foreground"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-monad-purple/20 text-lg font-bold text-monad-purple">
            All
          </span>
          <span className="font-medium">All collections</span>
        </button>
        {FEATURED_COLLECTIONS.map((collection) => (
          <CollectionFilterButton
            key={collection.address}
            collection={collection}
            selected={
              selectedCollection === collection.address.toLowerCase()
            }
            onClick={() => onSelect(collection.address.toLowerCase())}
          />
        ))}
      </div>
    </div>
  );
}

function CollectionFilterButton({
  collection,
  selected,
  onClick,
}: {
  collection: FeaturedCollection;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-32 shrink-0 flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${
        selected
          ? "border-monad-purple bg-monad-purple/15 text-foreground"
          : "border-border bg-secondary/40 text-muted-foreground hover:border-monad-purple/50 hover:text-foreground"
      }`}
      aria-pressed={selected}
    >
      {collection.logo ? (
        <Image
          src={collection.logo}
          alt={`${collection.name} logo`}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover ring-1 ring-border"
        />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-monad-purple/20 text-lg font-bold text-monad-purple">
          {collection.name.slice(0, 2)}
        </span>
      )}
      <span className="max-w-28 truncate font-medium">{collection.name}</span>
    </button>
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
