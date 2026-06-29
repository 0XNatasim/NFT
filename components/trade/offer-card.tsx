"use client";

import Link from "next/link";
import { ArrowLeftRight, Lock } from "lucide-react";
import type { TradeOffer } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { NFTCard } from "@/components/trade/nft-card";
import { formatMon, shortAddress, timeUntil } from "@/lib/utils";

const statusVariant = {
  open: "default",
  completed: "success",
  cancelled: "destructive",
  expired: "warning",
} as const;

const statusLabel = {
  open: "Open Deal",
  completed: "Handshake Completed",
  cancelled: "Deal Cancelled",
  expired: "Deal Expired",
} as const;

export function OfferCard({ offer }: { offer: TradeOffer }) {
  const makerNfts = offer.nfts.filter((n) => n.side === "maker");
  const takerNfts = offer.nfts.filter((n) => n.side === "taker");

  return (
    <Link
      href={`/offers/${offer.id}`}
      className="block rounded-xl border bg-card p-4 transition-colors hover:border-monad-purple/50"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{offer.isPrivate ? "Private Deal" : "Public Deal"}</span>
          <span>·</span>
          <span>{shortAddress(offer.makerAddress)}</span>
          {offer.isPrivate && <Lock className="h-3.5 w-3.5" />}
        </div>
        <div className="flex items-center gap-2">
          {offer.requiredMaxRarityRank != null && (
            <Badge variant="secondary">
              Top {offer.requiredMaxRarityRank.toLocaleString()}
            </Badge>
          )}
          <Badge variant={statusVariant[offer.status]}>
            {statusLabel[offer.status]}
          </Badge>
          {offer.status === "open" && (
            <span className="text-xs text-muted-foreground">
              expires in {timeUntil(offer.expiry)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TradeSide nfts={makerNfts} mon={offer.makerMonAmount} label="Maker gives" />
        <ArrowLeftRight className="h-5 w-5 text-monad-purple" />
        <TradeSide nfts={takerNfts} mon={offer.takerMonAmount} label="Taker gives" />
      </div>
    </Link>
  );
}

function TradeSide({
  nfts,
  mon,
  label,
}: {
  nfts: TradeOffer["nfts"];
  mon: string;
  label: string;
}) {
  const monAmount = BigInt(mon);

  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {nfts.slice(0, 4).map((nft) => (
          <NFTCard key={nft.id} nft={nft} size="sm" />
        ))}
      </div>
      {nfts.length > 4 && (
        <p className="mt-1 text-xs text-foreground">+{nfts.length - 4} more</p>
      )}
      {monAmount > 0n && (
        <p className="mt-1.5 text-sm font-semibold text-monad-purple">
          {formatMon(monAmount)} MON
        </p>
      )}
      {nfts.length === 0 && monAmount === 0n && (
        <p className="text-sm text-muted-foreground">Nothing</p>
      )}
    </div>
  );
}