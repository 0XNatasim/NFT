"use client";

import { cn } from "@/lib/utils";
import type { FeaturedCollection } from "@/lib/featured-collections";
import { SafeCollectionImage } from "@/components/ui/safe-collection-image";

export function CollectionButton({
  collection,
  active,
  onClick,
}: {
  collection: FeaturedCollection;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
    >
      <SafeCollectionImage
        collectionAddress={collection.address}
        alt=""
        className="h-5 w-5 rounded-sm"
        fallbackSrc={collection.image}
      />
      {collection.name}
    </button>
  );
}
