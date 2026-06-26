/* eslint-disable @next/next/no-img-element */
import { cn, shortAddress } from "@/lib/utils";
import { isCollectionBid } from "@/lib/collection-bids";
import type { NFTAsset } from "@/lib/types";
import { SafeCollectionImage } from "@/components/ui/safe-collection-image";

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function NFTCard({
  nft,
  selected,
  onClick,
  size = "md",
  price,
}: {
  nft: NFTAsset;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
  price?: {
    floorPrice: number | null;
    topOffer: number | null;
    currency: string;
  } | null;
}) {
  const collectionBid = isCollectionBid(nft);

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
        ) : collectionBid ? (
          <SafeCollectionImage
            collectionAddress={nft.contractAddress}
            alt={nft.collectionName ?? nft.name ?? "Collection logo"}
            className="h-full w-full transition-transform group-hover:scale-105"
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
          {collectionBid
            ? (nft.name ?? "Any NFT")
            : (nft.name ?? `#${nft.tokenId}`)}
        </p>
        {price && (price.floorPrice != null || price.topOffer != null) && (
          <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
            {price.floorPrice != null && (
              <span className="truncate font-medium text-foreground">
                {formatPrice(price.floorPrice)} {price.currency}
                <span className="ml-0.5 text-muted-foreground">floor</span>
              </span>
            )}
            {price.topOffer != null && (
              <span className="truncate text-muted-foreground">
                offer {formatPrice(price.topOffer)}
              </span>
            )}
          </div>
        )}
      </div>
      {selected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-monad-purple text-xs font-bold text-monad-black">
          ✓
        </div>
      )}
    </button>
  );
}