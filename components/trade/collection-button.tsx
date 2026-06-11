"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FeaturedCollection } from "@/lib/featured-collections";

export function CollectionButton({
  collection,
  active,
  onClick,
}: {
  collection: FeaturedCollection;
  active: boolean;
  onClick: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

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
      {collection.logo && !logoFailed && (
        <img
          src={collection.logo}
          alt=""
          className="h-5 w-5 rounded-sm object-cover"
          onError={() => setLogoFailed(true)}
        />
      )}
      {collection.name}
    </button>
  );
}
