"use client";

/* eslint-disable @next/next/no-img-element */
import { cn, shortAddress } from "@/lib/utils";
import type { NFTAsset } from "@/lib/types";

export function NFTCard({
  nft,
  selected,
  onClick,
  size = "md",
}: {
  nft: NFTAsset;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card text-left transition-all",
        onClick && "cursor-pointer hover:border-monad-purple/60",
        selected && "border-monad-purple ring-1 ring-monad-purple",
        !onClick && "cursor-default"
      )}
    >
      <div
        className={cn(
          "aspect-square w-full overflow-hidden bg-muted",
          size === "sm" ? "max-h-28" : ""
        )}
      >
        {nft.imageUrl ? (
          <img
            src={nft.imageUrl}
            alt={nft.name ?? `Token #${nft.tokenId}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
            ?
          </div>
        )}
      </div>
      <div className={cn("p-2", size === "sm" && "p-1.5")}>
        <p className="truncate text-xs text-muted-foreground">
          {nft.collectionName ?? shortAddress(nft.contractAddress)}
        </p>
        <p className="truncate text-sm font-medium">
          {nft.name ?? `#${nft.tokenId}`}
        </p>
      </div>
      {selected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-monad-purple text-xs font-bold text-monad-black">
          ✓
        </div>
      )}
    </button>
  );
}
