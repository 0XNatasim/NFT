"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MONAD_CHAIN_ID } from "@/lib/chains/monad";
import type { CollectionMetadata } from "@/lib/nft/collection-metadata";
import { cn } from "@/lib/utils";

const STATIC_COLLECTION_IMAGES: Record<string, string> = {
  "0x818030837e8350ba63e64d7dc01a547fa73c8279": "/collections/10Ksquad.png",
  "0x2a0001f3d4c98881376f8d36b3c61f163d84a095": "/collections/Erebus.png",
  "0x200723a706de0013316e5cd8eba2b3f53dd90c29": "/collections/r3tards.png",
  "0x36982448e77658b8f58f4665696e3173d1e696c2": "/collections/molandaks.png",
  "0xcbdfad1bfb6a4414dd4d84b7a6420dc43683deb0": "/collections/Roarrr.png",
  "0xaeaa920165fd7ce58a0e0772ffc97f06626572cd": "/collections/Sealuminati.png",
  "0x9f8514cebee138b61806d4651f51d26c8098b463": "/collections/The Daks.png",
  "0xfb5ba4061f5c50b1daa6c067bb2dfb0a8ebf6a8d": "/collections/Overnads.png",
  "0xe1ddf619bb352e6eb25367be99606be02836cbbc": "/collections/Chewy.png",
  "0xb0dad798c80e40dd6b8e8545074c6a5b7b97d2c0": "/collections/skrumpeys.png",
};

async function fetchMetadata(address: string, chainId: number) {
  const res = await fetch(`/api/collection-metadata?address=${address}&chainId=${chainId}`);
  if (!res.ok) throw new Error("Failed to fetch collection metadata");
  const json = (await res.json()) as { metadata: CollectionMetadata };
  return json.metadata;
}

export function useCollectionMetadata(collectionAddress?: string | null, chainId = MONAD_CHAIN_ID) {
  const address = collectionAddress?.toLowerCase();
  return useQuery({
    queryKey: ["collection-metadata", chainId, address],
    enabled: !!address,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: () => fetchMetadata(address!, chainId),
  });
}

export function SafeCollectionImage({
  collectionAddress,
  chainId = MONAD_CHAIN_ID,
  alt,
  className,
  fallbackSrc = "/Logomark.png",
}: {
  collectionAddress?: string | null;
  chainId?: number;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const { data } = useCollectionMetadata(collectionAddress, chainId);
  const staticSrc = collectionAddress
    ? STATIC_COLLECTION_IMAGES[collectionAddress.toLowerCase()]
    : undefined;
  const src = useMemo(
    () => staticSrc || data?.image || fallbackSrc,
    [data?.image, fallbackSrc, staticSrc]
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const finalSrc = failedSrc === src ? fallbackSrc : src;

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={cn("block bg-muted object-cover", className)}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}
