"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NFTCard, NFTListItem } from "@/components/trade/nft-card";
import { EmptyState } from "@/components/empty-state";
import { useCollectionPrices, useWalletNFTsInfinite } from "@/hooks/use-market";
import { useCollectionApprovals } from "@/hooks/use-approvals";
import { ApproveCollectionButton } from "@/components/trade/approve-collection-button";
import { cn, prettyCollectionName, shortAddress } from "@/lib/utils";
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
  pendingContracts,
}: {
  selected: NFTAsset[];
  onToggle: (nft: NFTAsset) => void;
  /** Collections with an in-flight approval tx — shown with a pending dot. */
  pendingContracts?: Set<string>;
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
  // Empty set = no filter (show all). Otherwise show only selected contracts.
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set()
  );
  const [layout, setLayout] = useState<"cards" | "list">("cards");

  function toggleCollection(address: string) {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  }

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
      const label =
        prettyCollectionName(nft.collectionName) ??
        shortAddress(nft.contractAddress);
      const prev = map.get(key);
      map.set(key, { label, count: (prev?.count ?? 0) + 1 });
    }
    return Array.from(map.entries())
      .map(([addr, v]) => ({ address: addr, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [nfts]);

  const { data: prices } = useCollectionPrices(
    collections.map((c) => c.address)
  );

  const { stateFor: approvalState } = useCollectionApprovals(
    collections.map((c) => c.address)
  );
  const approvalFor = (contract: string) =>
    approvalState(contract, pendingContracts?.has(contract.toLowerCase()));

  // Only collections approved for trading appear in the selector (plus ones
  // still loading, so nothing flickers). Confirmed-unapproved ones are surfaced
  // in the banner with an inline Approve action instead.
  const tradableCollections = useMemo(
    () => collections.filter((c) => approvalFor(c.address) !== "unapproved"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collections, approvalState, pendingContracts],
  );
  const unapprovedCollections = useMemo(
    () => collections.filter((c) => approvalFor(c.address) === "unapproved"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collections, approvalState, pendingContracts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nfts.filter((nft) => {
      if (
        selectedCollections.size > 0 &&
        !selectedCollections.has(nft.contractAddress.toLowerCase())
      ) {
        return false;
      }
      // We never trade unapproved collections, so hide the ones we've
      // confirmed are unapproved. "unknown" (read failed/loading) and
      // "pending" stay visible so nothing tradeable is hidden by mistake.
      if (approvalFor(nft.contractAddress) === "unapproved") {
        return false;
      }
      if (!q) return true;
      const haystack = [nft.name, nft.collectionName, nft.tokenId, nft.contractAddress]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    // approvalFor closes over approvalState/pendingContracts which are covered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nfts, query, selectedCollections, approvalState, pendingContracts]);

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
    <div className="space-y-4">
      {unapprovedCollections.length > 0 && (
        <div className="space-y-2 rounded-xl border-l-4 border-l-amber-500 border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-sm font-semibold text-amber-500">
            {unapprovedCollections.length} of your collection
            {unapprovedCollections.length === 1 ? " needs" : "s need"} approval
            to trade
          </p>
          <p className="text-xs text-muted-foreground">
            They&apos;re hidden from the selector below until approved. This is a
            one-time wallet permission (moves nothing).
          </p>
          <div className="flex flex-col gap-2 pt-1">
            {unapprovedCollections.map((c) => (
              <div
                key={c.address}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-2"
              >
                <span className="flex items-center gap-2 truncate text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 ring-2 ring-background" />
                  <span className="truncate">{c.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({c.count})
                  </span>
                </span>
                <ApproveCollectionButton collectionAddress={c.address} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        {/* Left: collections filter */}
        <aside className="md:w-56 md:shrink-0">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections…"
          className="mb-3"
        />
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Collections
          </span>
          {selectedCollections.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCollections(new Set())}
              className="text-xs text-monad-purple hover:underline"
            >
              Clear ({selectedCollections.size})
            </button>
          )}
        </div>
        <div className="flex max-h-80 flex-row gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-y-auto md:overflow-x-visible">
          {tradableCollections.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">
              No approved collections yet.
            </p>
          ) : (
            tradableCollections.map((c) => (
              <CollectionRow
                key={c.address}
                checked={selectedCollections.has(c.address)}
                onClick={() => toggleCollection(c.address)}
                label={c.label}
                count={c.count}
              />
            ))
          )}
        </div>
      </aside>

      {/* Right: NFT grid */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {nfts.length} NFTs
            {isFetchingNextPage && " · loading more…"}
          </p>
          <LayoutToggle layout={layout} onChange={setLayout} />
        </div>
        {filtered.length > 0 ? (
          layout === "cards" ? (
            <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
              {filtered.map((nft) => (
                <NFTCard
                  key={nftKey(nft)}
                  nft={nft}
                  selected={selected.some((n) => nftKey(n) === nftKey(nft))}
                  onClick={() => onToggle(nft)}
                  price={prices?.[nft.contractAddress.toLowerCase()]}
                  approval={approvalFor(nft.contractAddress)}
                />
              ))}
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {filtered.map((nft) => (
                <NFTListItem
                  key={nftKey(nft)}
                  nft={nft}
                  selected={selected.some((n) => nftKey(n) === nftKey(nft))}
                  onClick={() => onToggle(nft)}
                  price={prices?.[nft.contractAddress.toLowerCase()]}
                  approval={approvalFor(nft.contractAddress)}
                />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            title="No tradeable NFTs here"
            body="Only NFTs from approved collections are shown. If one is missing, its collection may need to be approved or added."
          />
        )}
        </div>
      </div>
    </div>
  );
}

function CollectionRow({
  checked,
  onClick,
  label,
  count,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors md:shrink",
        checked
          ? "border-monad-purple bg-monad-purple/10 text-monad-purple"
          : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
          checked
            ? "border-monad-purple bg-monad-purple text-monad-black"
            : "border-muted-foreground/40"
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path
              d="M2.5 6.5l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "ml-auto shrink-0 rounded-full px-1.5 text-xs",
          checked ? "bg-monad-purple/20" : "bg-muted"
        )}
      >
        {count}
      </span>
    </button>
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
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            layout === option
              ? "bg-monad-purple text-monad-black"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={layout === option}
        >
          {option === "cards" ? "Cards" : "List"}
        </button>
      ))}
    </div>
  );
}
