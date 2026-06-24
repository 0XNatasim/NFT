"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Handshake,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/trade/offer-card";
import { EmptyState } from "@/components/empty-state";
import { WelcomeTutorial } from "@/components/tutorial/welcome-tutorial";
import { useMarketStats, useOffers } from "@/hooks/use-market";
import { FEATURED_COLLECTIONS, type FeaturedCollection } from "@/lib/featured-collections";
import { formatMon } from "@/lib/utils";
import { Target, Upload, Sliders, Lock } from "lucide-react";

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

      <section className="relative my-6 grid gap-10 overflow-hidden rounded-[2rem] border border-monad-purple/20 bg-gradient-to-br from-monad-purple/15 via-fuchsia-500/10 to-cyan-400/10 px-5 py-16 shadow-2xl shadow-monad-purple/10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-8 md:py-24">
        <div className="pointer-events-none absolute right-12 top-10 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl" />
        <div className="pointer-events-none absolute bottom-8 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="text-center md:text-left">
          <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-200 md:mx-0">
            <Sparkles className="h-3.5 w-3.5" /> Bright wallet-to-wallet deals
          </p>
          <h1 className="text-balance mx-auto max-w-3xl text-4xl font-bold tracking-tight md:mx-0 md:text-6xl">
            Every trade is a <span className="text-monad-purple">handshake</span>.
            Human to human.
          </h1>
          <div className="mx-auto mt-5 max-w-xl space-y-3 text-foreground md:mx-0">
            <p className="text-lg">
              Create public or private NFT deals on Monad, a high-speed
              EVM-compatible chain — no bots, no snipers, no custody.
            </p>
            <p className="text-base text-foreground/85">
              Your NFTs stay in your wallet until the deal executes.
            </p>
            <BuiltOnMonadBadge />
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link
              href="/create"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-monad-purple to-fuchsia-400 px-8 text-base font-medium text-primary-foreground shadow-lg shadow-monad-purple/20 transition-colors hover:from-monad-purple/90 hover:to-fuchsia-400/90"
            >
              Propose a Deal <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-md border border-monad-purple/50 bg-transparent px-8 text-base font-medium text-foreground transition-colors hover:bg-monad-purple/10"
            >
              Browse Market
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4 md:mx-0">
            <Stat label="Handshakes completed" value={String(stats?.totalTrades ?? "—")} />
            <Stat label="Open Deals" value={String(stats?.openOffers ?? "—")} />
            <Stat
              label="Private Deals"
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

      <WhyMonadSection />

      <section className="border-t border-monad-purple/20 py-14">
        <h2 className="mb-8 text-center text-2xl font-semibold">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <HowCard
            icon={<Handshake className="h-6 w-6 text-monad-purple" />}
            title="1. Propose a Deal"
            body="Build a public or private deal with NFTs, MON, or both. Signing is free — no gas to propose."
          />
          <HowCard
            icon={<ShieldCheck className="h-6 w-6 text-monad-purple" />}
            title="2. Deal accepted"
            body="Another collector reviews exactly what moves on both sides, including fees, then accepts the deal in their wallet."
          />
          <HowCard
            icon={<Zap className="h-6 w-6 text-monad-purple" />}
            title="3. Everything swaps or nothing does"
            body="One transaction executes the trade. That’s atomic settlement: everything swaps or nothing does, then the handshake is completed."
          />
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/create"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-gradient-to-r from-monad-purple to-fuchsia-400 px-6 font-medium text-primary-foreground shadow-lg shadow-monad-purple/20 transition-colors hover:from-monad-purple/90 hover:to-fuchsia-400/90"
          >
            Propose your first deal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-t border-monad-purple/20 py-14">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-monad-purple/30 bg-monad-purple/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-monad-purple">
              <Sparkles className="h-3.5 w-3.5" /> Market
            </p>
            <h2 className="text-2xl font-semibold">Open Deals</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter by Monad collection so public deals stay easy to scan.
            </p>
          </div>
          <Link href="/create" className="text-sm text-monad-purple hover:underline">
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

      <section className="border-t border-monad-purple/20 py-14">
        <h2 className="mb-6 text-2xl font-semibold">Recent Handshakes</h2>
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
            title="No completed handshakes yet"
            body="Completed handshakes will show up here."
          />
        )}
      </section>
    </div>
  );
}

function BuiltOnMonadBadge() {
  return (
    <div className="group relative inline-flex flex-col items-center gap-2 md:items-start">
      <div className="inline-flex items-center gap-2 rounded-full border border-monad-purple/40 bg-monad-purple/15 px-3 py-1.5 text-sm font-medium text-foreground shadow-lg shadow-monad-purple/10">
        <span>⚡ Built on Monad</span>
        <a
          href="https://monad.xyz"
          target="_blank"
          rel="noreferrer"
          className="text-monad-purple underline-offset-4 hover:underline"
        >
          Learn more
        </a>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-72 -translate-x-1/2 rounded-xl border border-monad-purple/25 bg-background/95 p-3 text-left text-xs text-foreground opacity-0 shadow-2xl shadow-monad-purple/20 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:left-0 md:translate-x-0">
        Monad is a high-performance EVM-compatible blockchain designed for
        fast, low-cost apps.
      </div>
    </div>
  );
}

function WhyMonadSection() {
  return (
    <section
      id="why-monad"
      className="border-t border-monad-purple/20 py-14"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-monad-purple/30 bg-monad-purple/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-monad-purple">
          <Zap className="h-3.5 w-3.5" /> Why Monad?
        </p>
        <h2 className="text-3xl font-semibold">Why Handshake runs on Monad</h2>
        <p className="mt-3 text-base text-foreground/85">
          Handshake needs fast settlement, low fees, and familiar wallet tooling.
          Monad gives NFT traders that without changing the EVM experience.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <WhyMonadCard
          title="Fast settlement"
          body="Deals should feel instant. Monad is designed for high-throughput applications and responsive trading experiences."
        />
        <WhyMonadCard
          title="Lower-cost trading"
          body="NFT collectors should not hesitate because every action feels expensive. Handshake uses signatures for deal creation and on-chain settlement only when a deal executes."
        />
        <WhyMonadCard
          title="EVM-compatible"
          body="Collectors can use familiar wallets and smart contract patterns while trading on a faster execution layer."
        />
      </div>
      <div className="mt-6 text-center">
        <Link
          href="/about"
          className="text-sm font-medium text-monad-purple underline-offset-4 hover:underline"
        >
          Why Handshake?
        </Link>
      </div>
    </section>
  );
}

function WhyMonadCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="group border-monad-purple/20 bg-card/60 backdrop-blur transition-all hover:-translate-y-1 hover:border-monad-purple/50 hover:shadow-2xl hover:shadow-monad-purple/15">
      <CardContent className="p-6">
        <div className="mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-monad-purple to-fuchsia-400" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-foreground/85">{body}</p>
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
    <div className="rounded-2xl border border-monad-purple/20 bg-gradient-to-r from-monad-purple/10 via-card/80 to-cyan-400/10 p-3 shadow-lg shadow-monad-purple/5">
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
  const examples = [
    {
      id: 1,
      title: "Wanted",
      description: "Buy an NFT you’re looking for",
      Icon: Target,
    },
    {
      id: 2,
      title: "Sell NFT",
      description: "List your NFT for sale",
      Icon: Upload,
    },
    {
      id: 3,
      title: "Custom Deal",
      description: "Create a trade with custom terms",
      Icon: Sliders,
    },
    {
      id: 4,
      title: "Private Option",
      description: "Offer a deal to a specific wallet",
      Icon: Lock,
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-[2rem] bg-monad-purple/20 blur-3xl" />
      <Card className="relative overflow-hidden border-monad-purple/30 bg-gradient-to-br from-card/95 via-monad-purple/10 to-cyan-400/10 shadow-2xl shadow-monad-purple/10">
        <CardContent className="p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-monad-purple">
                  Live deal preview
                </p>
                <h3 className="text-xl font-semibold">Human deal, wallet settled</h3>
              </div>
              <span className="rounded-full border border-monad-purple/40 bg-monad-purple/10 px-3 py-1 text-xs text-monad-purple">
                No custody
              </span>
            </div>

            <div className="overflow-x-auto whitespace-nowrap scrollbar-hidden">
              <div className="inline-flex space-x-4">
                {examples.map((ex) => (
                  <ExampleCard key={ex.id} title={ex.title} description={ex.description} Icon={ex.Icon} />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExampleCard({ title, description, Icon }: { title: string; description: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="flex-shrink-0 w-56 border-monad-purple/20 bg-card/60 backdrop-blur transition-all hover:-translate-y-1 hover:border-monad-purple/50 hover:shadow-2xl hover:shadow-monad-purple/15">
      <CardContent className="p-4 space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-monad-purple/20 text-monad-purple">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-foreground/80">{description}</p>
      </CardContent>
    </Card>
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
    <div className="rounded-xl border border-monad-purple/20 bg-background/60 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {collections.map((collection) => (
          <div
            key={collection.address}
            className="overflow-hidden rounded-lg border border-monad-purple/20 bg-secondary shadow-md shadow-monad-purple/10"
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
    <Card className="border-monad-purple/20 bg-gradient-to-br from-monad-purple/15 via-card to-cyan-400/10 shadow-lg shadow-monad-purple/5">
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
    <Card className="border-monad-purple/20 bg-gradient-to-br from-card via-monad-purple/10 to-fuchsia-500/10 shadow-lg shadow-monad-purple/5">
      <CardContent className="p-6">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-monad-purple/15">
          {icon}
        </div>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="text-sm text-foreground/80">{body}</p>
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