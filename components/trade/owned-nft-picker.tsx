"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, ChevronRight, Grid3X3, Search, Sparkles } from "lucide-react";
import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NFTCard } from "@/components/trade/nft-card";
import { EmptyState } from "@/components/empty-state";
import { SafeCollectionImage } from "@/components/ui/safe-collection-image";
import { useCollectionPrices, useWalletNFTsInfinite } from "@/hooks/use-market";
import { cn, prettyCollectionName, shortAddress } from "@/lib/utils";
import type { NFTAsset } from "@/lib/types";

function nftKey(n: { contractAddress: string; tokenId: string }) {
  return `${n.contractAddress.toLowerCase()}:${n.tokenId}`;
}

function formatPrice(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/**
 * Premium wallet explorer for choosing owned NFTs. It starts at the wallet's
 * collection level, then reveals the NFTs owned in the active collection.
 */
export function OwnedNFTPicker({
  selected,
  onToggle,
}: {
  selected: NFTAsset[];
  onToggle: (nft: NFTAsset) => void;
}) {
  const { address } = useAccount();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useWalletNFTsInfinite(address);

  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const nfts = useMemo<NFTAsset[]>(
    () => data?.pages.flatMap((p) => p.nfts) ?? [],
    [data]
  );

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const collections = useMemo(() => {
    const map = new Map<string, { label: string; count: number; sample?: NFTAsset }>();
    for (const nft of nfts) {
      const key = nft.contractAddress.toLowerCase();
      const label =
        prettyCollectionName(nft.collectionName) ?? shortAddress(nft.contractAddress);
      const prev = map.get(key);
      map.set(key, { label, count: (prev?.count ?? 0) + 1, sample: prev?.sample ?? nft });
    }
    return Array.from(map.entries())
      .map(([addr, v]) => ({ address: addr, ...v }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [nfts]);

  useEffect(() => {
    if (!activeCollection && collections.length > 0) {
      setActiveCollection(collections[0].address);
    }
  }, [activeCollection, collections]);

  const { data: prices } = useCollectionPrices(collections.map((c) => c.address));

  const active = collections.find((c) => c.address === activeCollection) ?? collections[0];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nfts.filter((nft) => {
      if (active && nft.contractAddress.toLowerCase() !== active.address) return false;
      if (!q) return true;
      return [nft.name, nft.collectionName, nft.tokenId, nft.contractAddress]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [active, nfts, query]);

  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-monad-purple/25 bg-black/30 p-5 shadow-2xl shadow-monad-purple/10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <EmptyState
        title="No NFTs found"
        body="We couldn't find ERC-721 NFTs in this wallet on Monad."
      />
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-monad-purple/30 bg-slate-950/55 p-4 shadow-2xl shadow-monad-purple/15 backdrop-blur-xl sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(131,91,255,0.22),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.12),transparent_28%)]" />
      <div className="relative space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-monad-purple">
              <Sparkles className="h-4 w-4" /> Browse your NFTs
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-white">Choose from your wallet</h3>
            <p className="text-sm text-white/65">
              {collections.length} collections · {nfts.length} NFTs indexed
              {isFetchingNextPage && " · syncing wallet…"}
            </p>
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search NFTs…"
              className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/35"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {collections.map((collection) => {
            const checked = active?.address === collection.address;
            const floor = prices?.[collection.address]?.floorPrice;
            const currency = prices?.[collection.address]?.currency ?? "MON";
            return (
              <button
                key={collection.address}
                type="button"
                onClick={() => setActiveCollection(collection.address)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-white/[0.04] p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:border-monad-purple/70 hover:shadow-xl hover:shadow-monad-purple/20",
                  checked
                    ? "border-monad-purple shadow-2xl shadow-monad-purple/25 ring-1 ring-monad-purple/70"
                    : "border-white/10"
                )}
              >
                <div className="relative aspect-[1.25] overflow-hidden rounded-xl bg-white/5">
                  <SafeCollectionImage
                    collectionAddress={collection.address}
                    alt={collection.label}
                    className="h-full w-full transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  <div className="absolute right-2 top-2 rounded-full bg-monad-purple px-2 py-1 text-[11px] font-bold text-white shadow-lg shadow-monad-purple/40">
                    <BadgeCheck className="mr-1 inline h-3.5 w-3.5" /> Verified
                  </div>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{collection.label}</p>
                    <p className="text-xs text-white/55">{collection.count.toLocaleString()} owned items</p>
                  </div>
                  <ChevronRight className={cn("mt-1 h-5 w-5 text-monad-purple transition", checked && "translate-x-0.5")} />
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-xs uppercase tracking-wide text-white/45">Floor price</p>
                  <p className="mt-0.5 text-lg font-bold text-white">{formatPrice(floor)} {floor == null ? "" : currency}</p>
                </div>
              </button>
            );
          })}
        </div>

        {active && (
          <div className="rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-monad-purple">Select your NFT</p>
                <h4 className="text-2xl font-semibold text-white">{active.label}</h4>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 sm:flex">
                <Grid3X3 className="h-4 w-4 text-monad-purple" /> {filtered.length} items
              </div>
            </div>
            {filtered.length > 0 ? (
              <div className="grid max-h-[28rem] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-5">
                {filtered.map((nft) => (
                  <NFTCard
                    key={nftKey(nft)}
                    nft={nft}
                    selected={selected.some((n) => nftKey(n) === nftKey(nft))}
                    onClick={() => onToggle(nft)}
                    price={prices?.[nft.contractAddress.toLowerCase()]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No matches" body="No NFTs match your search." />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
