"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NFTCard } from "@/components/trade/nft-card";
import { EmptyState } from "@/components/empty-state";
import { useCollectionPrices, useWalletNFTsInfinite } from "@/hooks/use-market";
import { cn, prettyCollectionName, shortAddress } from "@/lib/utils";
import type { NFTAsset } from "@/lib/types";

export function WalletNFTs({ owner }: { owner: string }) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWalletNFTsInfinite(owner);

  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<string | null>(null);
  const [selectedNft, setSelectedNft] = useState<NFTAsset | null>(null);

  const nfts = useMemo<NFTAsset[]>(
    () => data?.pages.flatMap((p) => p.nfts) ?? [],
    [data]
  );

  // Eagerly pull the full collection so the filter/search covers everything,
  // not just the first page the indexer returned.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Distinct collections, keyed by contract, with a display label and count.
  const collections = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const nft of nfts) {
      const key = nft.contractAddress.toLowerCase();
      const label =
        prettyCollectionName(nft.collectionName) ??
        shortAddress(nft.contractAddress);
      const prev = map.get(key);
      map.set(key, { label, count: (prev?.count ?? 0) + 1 });
    }
    return Array.from(map.entries())
      .map(([address, v]) => ({ address, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [nfts]);

  const { data: prices } = useCollectionPrices(
    collections.map((c) => c.address)
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nfts.filter((nft) => {
      if (collection && nft.contractAddress.toLowerCase() !== collection) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        nft.name,
        nft.collectionName,
        nft.tokenId,
        nft.contractAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [nfts, query, collection]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, token ID or collection…"
          className="sm:max-w-xs"
        />
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {nfts.length} NFTs
          {isFetchingNextPage && " · loading more…"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={collection === null}
          onClick={() => setCollection(null)}
          label="All"
          count={nfts.length}
        />
        {collections.map((c) => (
          <FilterChip
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

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {filtered.map((nft) => (
            <NFTCard
              key={`${nft.contractAddress}:${nft.tokenId}`}
              nft={nft}
              price={prices?.[nft.contractAddress.toLowerCase()]}
              onClick={() => setSelectedNft(nft)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matches"
          body="No NFTs match your search or filter."
        />
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {selectedNft && (
        <div className="rounded-xl border border-monad-purple/30 bg-card p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-monad-purple">
                NFT details
              </p>
              <h3 className="text-lg font-semibold">
                {selectedNft.name ?? `#${selectedNft.tokenId}`}
              </h3>
              <p className="text-sm text-foreground">
                {prettyCollectionName(selectedNft.collectionName) ??
                  shortAddress(selectedNft.contractAddress)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedNft(null)}>
              Close
            </Button>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Token ID" value={selectedNft.tokenId} />
            <Detail
              label="Contract"
              value={selectedNft.contractAddress}
              mono
            />
            <Detail
              label="Floor"
              value={
                prices?.[selectedNft.contractAddress.toLowerCase()]?.floorPrice != null
                  ? `${prices[selectedNft.contractAddress.toLowerCase()].floorPrice} ${
                      prices[selectedNft.contractAddress.toLowerCase()].currency
                    }`
                  : "Unavailable"
              }
            />
            <Detail
              label="Top offer"
              value={
                prices?.[selectedNft.contractAddress.toLowerCase()]?.topOffer != null
                  ? `${prices[selectedNft.contractAddress.toLowerCase()].topOffer} ${
                      prices[selectedNft.contractAddress.toLowerCase()].currency
                    }`
                  : "Unavailable"
              }
            />
          </div>
          <p className="mt-3 text-sm text-foreground">
            Traits and price history will appear here when the metadata provider
            includes them; the contract address and token ID are available now so
            traders can verify the asset without leaving Handshake.
          </p>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-monad-purple">
        {label}
      </p>
      <p className={cn("mt-1 break-all text-foreground", mono && "font-mono text-xs")}>
        {value}
      </p>
    </div>
  );
}

function FilterChip({
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
        "flex max-w-[14rem] items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-monad-purple bg-monad-purple/10 text-monad-purple"
          : "border-border text-muted-foreground hover:border-monad-purple/50 hover:text-foreground"
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
