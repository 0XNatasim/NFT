"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeCollectionImage } from "@/components/ui/safe-collection-image";
import { CollectionStatusDot } from "@/components/trade/collection-status-dot";
import { OfferCard, OfferListItem } from "@/components/trade/offer-card";
import { EmptyState } from "@/components/empty-state";
import { useOffers } from "@/hooks/use-market";
import { useCollectionsSettlementApproved } from "@/hooks/use-collections-settlement-approved";
import {
  FEATURED_COLLECTIONS,
  isCollectionTradeLocked,
  type FeaturedCollection,
} from "@/lib/featured-collections";

export default function MarketPage() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null,
  );
  const [layout, setLayout] = useState<"cards" | "list">("cards");
  const activeCollection = FEATURED_COLLECTIONS.find(
    (collection) => collection.address.toLowerCase() === selectedCollection,
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
  const visibleOpenOffers = (openOffers ?? []).filter(
    (offer) => offer.expiry > Date.now() / 1000,
  );

  return (
    <div className="container mx-auto px-4">
      <section className="py-14">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-monad-purple/30 bg-monad-purple/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-monad-purple">
              <Sparkles className="h-3.5 w-3.5" /> Market
            </p>
            <h1 className="text-3xl font-semibold">Open Deals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter by Monad collection so public deals stay easy to scan.
            </p>
          </div>
          <Link
            href="/create"
            className="text-sm text-monad-purple hover:underline"
          >
            Propose a Deal →
          </Link>
        </div>

        <CollectionFilterBanner
          selectedCollection={selectedCollection}
          onSelect={setSelectedCollection}
        />

        <div className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {activeCollection
              ? `Showing ${activeCollection.name} deals`
              : "Showing all featured collection deals"}
          </span>
          <div className="flex items-center gap-3">
            <LayoutToggle layout={layout} onChange={setLayout} />
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
        </div>

        {loadingOpen ? (
          <OfferSkeleton layout={layout} />
        ) : visibleOpenOffers.length > 0 ? (
          layout === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleOpenOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleOpenOffers.map((offer) => (
                <OfferListItem key={offer.id} offer={offer} />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            title={
              activeCollection
                ? `No ${activeCollection.name} deals yet`
                : "No open deals yet"
            }
            body={
              activeCollection
                ? "Clear the filter or propose the first deal for this collection."
                : "Be the first to propose a deal on the board."
            }
          />
        )}
      </section>

      <section
        id="recent-handshakes"
        className="border-t border-monad-purple/20 py-14"
      >
        <h2 className="mb-6 text-2xl font-semibold">Recent Handshakes</h2>
        {loadingRecent ? (
          <OfferSkeleton layout={layout} />
        ) : recentTrades && recentTrades.length > 0 ? (
          layout === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentTrades.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((offer) => (
                <OfferListItem key={offer.id} offer={offer} />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            title="No completed handshakes yet"
            body="Completed handshakes will show up here."
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
  const { approved: onchainApproved } = useCollectionsSettlementApproved(
    FEATURED_COLLECTIONS.map((c) => c.address),
  );
  return (
    <div className="rounded-2xl border border-monad-purple/20 bg-gradient-to-r from-monad-purple/10 via-card/80 to-cyan-400/10 p-3 shadow-lg shadow-monad-purple/5">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CollectionStatusDot locked={false} />
          Tradeable
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CollectionStatusDot locked />
          Trading locked (awaiting collection approval)
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${
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
            selected={selectedCollection === collection.address.toLowerCase()}
            onchainApproved={onchainApproved[collection.address.toLowerCase()]}
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
  onchainApproved,
}: {
  collection: FeaturedCollection;
  selected: boolean;
  onClick: () => void;
  onchainApproved?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${
        selected
          ? "border-monad-purple bg-monad-purple/15 text-foreground"
          : "border-border bg-secondary/40 text-muted-foreground hover:border-monad-purple/50 hover:text-foreground"
      }`}
      aria-pressed={selected}
    >
      <span className="relative inline-flex">
        <SafeCollectionImage
          collectionAddress={collection.address}
          alt={`${collection.name} logo`}
          className="h-12 w-12 rounded-full ring-1 ring-border"
        />
        <CollectionStatusDot
          locked={isCollectionTradeLocked(collection, onchainApproved)}
          className="absolute right-0 top-0 h-3 w-3"
        />
      </span>
      <span className="w-full truncate text-center font-medium">
        {collection.name}
      </span>
    </button>
  );
}

function OfferSkeleton({ layout }: { layout: "cards" | "list" }) {
  if (layout === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}

function LayoutToggle({
  layout,
  onChange,
}: {
  layout: "cards" | "list";
  onChange: (layout: "cards" | "list") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background p-1">
      {(["cards", "list"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
            layout === option
              ? "bg-monad-purple text-monad-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={layout === option}
        >
          {option === "cards" ? "Cards" : "List"}
        </button>
      ))}
    </div>
  );
}
