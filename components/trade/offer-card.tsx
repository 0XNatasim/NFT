"use client";

import Link from "next/link";
import { ArrowLeftRight, Lock } from "lucide-react";
import type { TradeOffer } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { NFTCard } from "@/components/trade/nft-card";
import { rarityRankBadgeClass, shortAddress, timeUntil, formatMon } from "@/lib/utils";

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
            <Badge
              variant="outline"
              className={rarityRankBadgeClass(offer.requiredMaxRarityRank)}
            >
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

export function OfferListItem({ offer }: { offer: TradeOffer }) {
  const makerNfts = offer.nfts.filter((n) => n.side === "maker");
  const takerNfts = offer.nfts.filter((n) => n.side === "taker");

  return (
    <Link
      href={`/offers/${offer.id}`}
      className="block rounded-xl border bg-card p-4 transition-colors hover:border-monad-purple/50"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[offer.status]}>
              {statusLabel[offer.status]}
            </Badge>
            {offer.requiredMaxRarityRank != null && (
              <Badge
                variant="outline"
                className={rarityRankBadgeClass(offer.requiredMaxRarityRank)}
              >
                Top {offer.requiredMaxRarityRank.toLocaleString()}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {offer.isPrivate ? "Private Deal" : "Public Deal"} ·{" "}
              {shortAddress(offer.makerAddress)}
            </span>
            {offer.isPrivate && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            {offer.status === "open" && (
              <span className="text-xs text-muted-foreground">
                expires in {timeUntil(offer.expiry)}
              </span>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <TradeSideSummary
              nfts={makerNfts}
              mon={offer.makerMonAmount}
              label="Maker gives"
            />
            <ArrowLeftRight className="hidden h-5 w-5 text-monad-purple md:block" />
            <TradeSideSummary
              nfts={takerNfts}
              mon={offer.takerMonAmount}
              label="Taker gives"
            />
          </div>
        </div>
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

function TradeSideSummary({
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
    <div className="min-w-0 rounded-lg border border-border/70 bg-background/40 p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex min-w-0 items-center gap-3">
        {nfts.length > 0 && (
          <div className="flex shrink-0 -space-x-2">
            {nfts.slice(0, 3).map((nft) => (
              <div
                key={nft.id}
                className="h-14 w-14 overflow-hidden rounded-lg border-2 border-card bg-card"
              >
                <NFTCard nft={nft} size="sm" />
              </div>
            ))}
          </div>
        )}
        <div className="min-w-0 flex-1 text-sm">
          {nfts.length > 0 ? (
            <p className="truncate font-medium">
              {nfts.length} NFT{nfts.length === 1 ? "" : "s"}
              {nfts.length > 3 && ` · +${nfts.length - 3} more`}
            </p>
          ) : (
            <p className="text-muted-foreground">No NFTs</p>
          )}
          {monAmount > 0n && (
            <p className="mt-0.5 font-semibold text-monad-purple">
              {formatMon(monAmount)} MON
            </p>
          )}
          {nfts.length === 0 && monAmount === 0n && (
            <p className="mt-0.5 text-muted-foreground">Nothing</p>
          )}
        </div>
      </div>
    </div>
  );
}
