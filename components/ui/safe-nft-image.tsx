"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isCollectionBid } from "@/lib/collection-bids";
import { cn } from "@/lib/utils";
import { SafeCollectionImage } from "@/components/ui/safe-collection-image";

interface TokenMetadataResponse {
  name: string | null;
  image: string | null;
  collectionName: string | null;
}

async function fetchTokenMetadata(contractAddress: string, tokenId: string) {
  const params = new URLSearchParams({ contract: contractAddress, tokenId });
  const res = await fetch(`/api/token-metadata?${params}`);
  if (!res.ok) throw new Error("Failed to fetch token metadata");
  return (await res.json()) as TokenMetadataResponse;
}

export function SafeNftImage({
  contractAddress,
  tokenId,
  imageUrl,
  alt,
  className,
  collectionName,
  collectionBid,
}: {
  contractAddress: string;
  tokenId: string;
  imageUrl?: string | null;
  alt: string;
  className?: string;
  collectionName?: string | null;
  collectionBid?: boolean;
}) {
  const isBid = collectionBid ?? isCollectionBid({ tokenId, metadata: null });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["token-metadata", contractAddress.toLowerCase(), tokenId],
    enabled: !imageUrl && !isBid,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: () => fetchTokenMetadata(contractAddress, tokenId),
  });

  const src = useMemo(() => imageUrl || data?.image || null, [imageUrl, data?.image]);

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("block bg-muted object-cover", className)}
        loading="lazy"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  if (isBid) {
    return (
      <SafeCollectionImage
        collectionAddress={contractAddress}
        alt={collectionName ?? alt}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-2xl text-muted-foreground",
        className
      )}
    >
      ?
    </div>
  );
}
