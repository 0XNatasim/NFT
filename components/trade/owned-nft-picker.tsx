"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NFTCard } from "@/components/trade/nft-card";
import { EmptyState } from "@/components/empty-state";
import { useWalletNFTsInfinite } from "@/hooks/use-market";
import { cn, shortAddress } from "@/lib/utils";
import type { NFTAsset } from "@/lib/types";

function nftKey(n: { contractAddress: string; tokenId: string }) {
  return `${n.contractAddress.toLowerCase()}:${n.tokenId}`;
}

/**
 * NFT picker with an OpenSea-style collection filter on the left. Loads the
 * wallet's full collection (walking every indexer page) so the filter and
 * search cover everything, not just the first ~25 tokens.
 */
export function OwnedNFTPicker({
  selected,
  onToggle,
}: {
  selected: NFTAsset[];
  onToggle: (nft: NFTAsset) => void;
}) {
  const { address } = useAccount();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWalletNFTsInfinite(address);

  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<string | null>(null);

  const nfts = useMemo<NFTAsset[]>(
    () => data?.pages.flatMap((p) => p.nfts) ?? [],
    [data]
  );

  // Eagerly pull the full collection so the filter covers everything.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const collections = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const nft of nfts) {
      const key = nft.contractAddress.toLowerCase();
      const label = nft.collectionName ?? shortAddress(nft.contractAddress);
      const prev = map.get(key);
      map.set(key, { label, count: (prev?.count ?? 0) + 1 });
    }
    return Array.from(map.entries())
      .map(([addr, v]) => ({ address: addr, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [nfts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nfts.filter((nft) => {
      if (collection && nft.contractAddress.toLowerCase() !== collection) {
        return false;
      }
      if (!q) return true;
      const haystack = [nft.name, nft.collectionName, nft.tokenId, nft.contractAddress]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [nfts, query, collection]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
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
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Left: collections filter */}
      <aside className="md:w-56 md:shrink-0">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections…"
          className="mb-3"
        />
        <div className="flex max-h-80 flex-row gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-y-auto md:overflow-x-visible">
          <CollectionRow
            active={collection === null}
            onClick={() => setCollection(null)}
            label="All collections"
            count={nfts.length}
          />
          {collections.map((c) => (
            <CollectionRow
              key={c.address}
              active={collection === c.address}
              onClick={() =>
                setCollection(collection === c.address ? null : c.address)
              }
              label={c.label}
              count={c.count}
            />
          ))}
        </div>
      </aside>

      {/* Right: NFT grid */}
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-xs text-muted-foreground">
          {filtered.length} of {nfts.length} NFTs
          {isFetchingNextPage && " · loading more…"}
        </p>
        {filtered.length > 0 ? (
          <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
            {filtered.map((nft) => (
              <NFTCard
                key={nftKey(nft)}
                nft={nft}
                selected={selected.some((n) => nftKey(n) === nftKey(nft))}
                onClick={() => onToggle(nft)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No matches" body="No NFTs match your filter." />
        )}
      </div>
    </div>
  );
}

function CollectionRow({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors md:shrink",
        active
          ? "border-monad-purple bg-monad-purple/10 text-monad-purple"
          : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 text-xs",
          active ? "bg-monad-purple/20" : "bg-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}
