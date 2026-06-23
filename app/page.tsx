"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Handshake,
  HeartHandshake,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/trade/offer-card";
import { EmptyState } from "@/components/empty-state";
import { useMarketStats, useOffers } from "@/hooks/use-market";
import { FEATURED_COLLECTIONS, type FeaturedCollection } from "@/lib/featured-collections";
import { formatMon } from "@/lib/utils";

export default function HomePage() {
  const { address } = useAccount();
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
  const { data: walletOffers } = useOffers({
    wallet: address,
    status: "open",
    limit: 100,
  });
  const privateOffers =
    walletOffers?.filter(
      (offer) =>
        offer.isPrivate &&
        offer.takerAddress?.toLowerCase() === address?.toLowerCase() &&
        offer.makerAddress.toLowerCase() !== address?.toLowerCase()
    ).length ?? null;

  return (
    <div className="container mx-auto px-4">
      <WelcomeTutorial />

      {/* Hero */}
      <section className="grid gap-10 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">
        <div className="text-center md:text-left">
          <h1 className="text-balance mx-auto max-w-3xl text-4xl font-bold tracking-tight md:mx-0 md:text-6xl">
            Every trade is a <span className="text-monad-purple">handshake</span>.
            Human to human.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground md:mx-0">
            Deal NFTs directly with another wallet on Monad, a high-speed
            EVM-compatible chain — no bots, no snipers, no middleman. You set the
            terms, they shake on it, and one transaction swaps everything or
            nothing. We never hold your NFTs; your wallet stays in control.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link
              href="/create"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Propose a deal <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/wanted"
              className="inline-flex h-12 items-center justify-center rounded-md border border-monad-purple/50 bg-transparent px-8 text-base font-medium text-foreground transition-colors hover:bg-monad-purple/10"
            >
              Browse wanted board
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4 md:mx-0">
            <Stat label="Trades settled" value={String(stats?.totalTrades ?? "—")} />
            <Stat label="Open offers" value={String(stats?.openOffers ?? "—")} />
            <Stat
              label="Private offers"
              value={address ? String(privateOffers ?? "—") : "Connect"}
            />
            <Stat
              label="MON volume"
              value={stats ? formatMon(BigInt(stats.totalVolumeWei)) : "—"}
            />
          </div>
        </div>

        <HeroPreview />
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
            title="3. Everything swaps or nothing does"
            body="One transaction instantly settles the deal. That’s atomic settlement: no escrow middlemen, no platform custody — the contract verifies signatures, ownership and approvals."
          />
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/create"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start your first trade <ArrowRight className="h-4 w-4" />
          </Link>
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

const TUTORIAL_STORAGE_KEY = "handshake-hide-welcome-tutorial";

function WelcomeTutorial() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const tutorialPages = [
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "Buy an NFT with MON",
      eyebrow: "Page 1 of 3",
      example: "Example: buy 1x 10kSquad for 3,000 MON",
      description:
        "Use this when you know the NFT you want and want to offer MON directly to the owner.",
      steps: [
        "Choose Buy NFTs with MON in the trade builder.",
        "Enter 3,000 MON as the amount you give.",
        "Add the 10kSquad NFT you want by contract + token ID.",
        "Sign the offer for free. The owner can accept and settle everything in one transaction.",
      ],
      ctaHref: "/create",
      ctaLabel: "Create buy offer",
    },
    {
      icon: <HeartHandshake className="h-5 w-5" />,
      title: "Create a custom trade",
      eyebrow: "Page 2 of 3",
      example: "Example: trade 1x 10kSquad + 10,000 MON for 1x r3tard",
      description:
        "Use custom trades when both sides include NFTs and MON, or when you need more control than a simple buy/sell/swap.",
      steps: [
        "Choose Custom Trade in the trade builder.",
        "Add your 10kSquad NFT and 10,000 MON on the side you give.",
        "Request the r3tard NFT on the side you get.",
        "Handshake only settles if both wallets still match the signed deal.",
      ],
      ctaHref: "/create",
      ctaLabel: "Build custom trade",
    },
    {
      icon: <Search className="h-5 w-5" />,
      title: "Post on the Wanted board",
      eyebrow: "Page 3 of 3",
      example: "Example: wanted — 1x 10kSquad",
      description:
        "Use the Wanted board when you are hunting for a collection and want other traders to send you private offers.",
      steps: [
        "Open Want and choose 10kSquad as the collection.",
        "Pick a rarity, add your offer, and leave notes if needed.",
        "Other traders can answer your post with a private offer.",
        "Review matching offers from your Dashboard before accepting.",
      ],
      ctaHref: "/wanted",
      ctaLabel: "Post wanted request",
    },
  ];
  const currentPage = tutorialPages[pageIndex];
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === tutorialPages.length - 1;

  useEffect(() => {
    if (window.localStorage.getItem(TUTORIAL_STORAGE_KEY) !== "true") {
      setOpen(true);
    }
  }, []);

  function closeTutorial() {
    if (dontShowAgain) {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-4 py-6 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tutorial-title"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-monad-purple/30 bg-card p-5 shadow-2xl shadow-monad-purple/20">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-monad-purple/30 bg-monad-purple/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-monad-purple">
              <Sparkles className="h-3.5 w-3.5" /> Quick tutorial
            </p>
            <h2 id="welcome-tutorial-title" className="text-2xl font-bold">
              {currentPage.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-foreground">
              {currentPage.description}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={closeTutorial}
            aria-label="Close tutorial"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid gap-2 sm:grid-cols-3">
          {tutorialPages.map((page, index) => (
            <button
              key={page.title}
              type="button"
              onClick={() => setPageIndex(index)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                index === pageIndex
                  ? "border-monad-purple bg-monad-purple/15 text-foreground"
                  : "border-border bg-background/60 text-muted-foreground hover:border-monad-purple/50 hover:text-foreground"
              }`}
            >
              <span className="mb-1 block text-xs uppercase tracking-wide">
                Page {index + 1}
              </span>
              <span className="font-medium">{page.title}</span>
            </button>
          ))}
        </div>

        <TutorialPage
          icon={currentPage.icon}
          eyebrow={currentPage.eyebrow}
          title={currentPage.title}
          example={currentPage.example}
          steps={currentPage.steps}
        />

        <label className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-monad-purple"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
          />
          <span>
            <span className="block font-medium">Don&apos;t show this again</span>
            <span className="text-muted-foreground">
              You must check this box before closing if you do not want the
              tutorial to appear the next time you open Handshake.
            </span>
          </span>
        </label>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            disabled={isFirstPage}
            onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
          >
            Back
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {!isLastPage ? (
              <Button onClick={() => setPageIndex((index) => index + 1)}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={closeTutorial}>
                Close for now
              </Button>
            )}
            <Link
              href={currentPage.ctaHref}
              onClick={closeTutorial}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {currentPage.ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialPage({
  icon,
  eyebrow,
  title,
  example,
  steps,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  example: string;
  steps: string[];
}) {
  return (
    <Card className="border-monad-purple/20 bg-background/60">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-monad-purple text-monad-black">
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-monad-purple">
              {eyebrow}
            </p>
            <h3 className="text-xl font-semibold">{title}</h3>
          </div>
        </div>
        <p className="rounded-xl border border-monad-purple/30 bg-monad-purple/10 p-3 text-base font-medium text-monad-purple">
          {example}
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
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

function HeroPreview() {
  const featured = FEATURED_COLLECTIONS.slice(0, 4);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-[2rem] bg-monad-purple/20 blur-3xl" />
      <Card className="relative overflow-hidden border-monad-purple/30 bg-card/90 shadow-2xl shadow-monad-purple/10">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-monad-purple">
                Live offer preview
              </p>
              <h3 className="text-xl font-semibold">Human deal, wallet settled</h3>
            </div>
            <span className="rounded-full border border-monad-purple/40 bg-monad-purple/10 px-3 py-1 text-xs text-monad-purple">
              No custody
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <PreviewSide title="You give" collections={featured.slice(0, 2)} />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-monad-purple text-monad-black">
              <Handshake className="h-5 w-5" />
            </div>
            <PreviewSide title="You get" collections={featured.slice(2, 4)} />
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Settlement</span>
              <span className="text-monad-purple">1 transaction</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-monad-purple to-fuchsia-400" />
            </div>
            <p className="mt-2 text-xs text-foreground">
              Both wallets sign. The contract verifies ownership, approvals, and
              terms before anything moves.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewSide({
  title,
  collections,
}: {
  title: string;
  collections: FeaturedCollection[];
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {collections.map((collection) => (
          <div
            key={collection.address}
            className="overflow-hidden rounded-lg border border-monad-purple/20 bg-secondary"
          >
            {collection.logo ? (
              <Image
                src={collection.logo}
                alt={collection.name}
                width={96}
                height={96}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-monad-purple">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
          </div>
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
