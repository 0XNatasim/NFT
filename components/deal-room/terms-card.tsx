"use client";

import { NFTMedia } from "@/components/ui/nft-media";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cn,
  formatMon,
  prettyCollectionName,
  shortAddress,
  timeUntil,
} from "@/lib/utils";
import type { DealRoomRevision, RevisionNFT } from "@/lib/types";

/**
 * The current draft, oriented to the viewer: "You give / You receive".
 * Same visual vocabulary as the offer page so negotiation → settlement feels
 * like one continuous surface.
 */

function AssetSide({
  title,
  nfts,
  monWei,
  highlight,
}: {
  title: string;
  nfts: RevisionNFT[];
  monWei: string;
  highlight?: boolean;
}) {
  const mon = BigInt(monWei);
  const empty = nfts.length === 0 && mon === 0n;
  return (
    <div
      className={cn(
        "flex-1 rounded-lg border p-4",
        highlight
          ? "border-monad-purple/40 bg-monad-purple/5"
          : "border-border bg-secondary/30"
      )}
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {empty ? (
        <div className="text-sm text-muted-foreground">Nothing</div>
      ) : (
        <div className="space-y-3">
          {nfts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {nfts.map((nft) => {
                const collectionLabel =
                  prettyCollectionName(nft.collectionName) ??
                  shortAddress(nft.contractAddress);
                return (
                  <div
                    key={`${nft.contractAddress}:${nft.tokenId}`}
                    className="group relative overflow-hidden rounded-md border border-border"
                    title={`${collectionLabel} #${nft.tokenId} · ${nft.contractAddress}`}
                  >
                    <NFTMedia
                      imageUrl={nft.imageUrl}
                      metadata={nft.metadata}
                      alt={nft.name ?? `${collectionLabel} #${nft.tokenId}`}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="bg-background/90 px-1.5 py-1 text-[10px] leading-tight">
                      <div className="truncate font-medium">
                        {collectionLabel}
                      </div>
                      <div className="truncate text-muted-foreground">
                        #{nft.tokenId}
                        {nft.rarityRank ? ` · R${nft.rarityRank}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {mon > 0n && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-monad-purple">
                {formatMon(mon)}
              </span>
              <span className="text-sm text-muted-foreground">MON</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TermsCard({
  revision,
  viewerWallet,
  title = "Current terms",
}: {
  revision: DealRoomRevision;
  viewerWallet: string;
  title?: string;
}) {
  const viewerIsMaker =
    revision.makerAddress.toLowerCase() === viewerWallet.toLowerCase();

  const give = viewerIsMaker
    ? { nfts: revision.makerNFTs, mon: revision.makerMonAmount }
    : { nfts: revision.takerNFTs, mon: revision.takerMonAmount };
  const receive = viewerIsMaker
    ? { nfts: revision.takerNFTs, mon: revision.takerMonAmount }
    : { nfts: revision.makerNFTs, mon: revision.makerMonAmount };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="text-xs text-muted-foreground">
          Rev #{revision.revisionNumber} · offer expires {timeUntil(revision.offerExpiry)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <AssetSide title="You give" nfts={give.nfts} monWei={give.mon} />
          <div className="flex items-center justify-center text-2xl text-monad-purple sm:px-1">
            🤝
          </div>
          <AssetSide
            title="You receive"
            nfts={receive.nfts}
            monWei={receive.mon}
            highlight
          />
        </div>
        {revision.note && (
          <p className="mt-3 rounded-md bg-secondary/50 px-3 py-2 text-sm italic text-muted-foreground">
            “{revision.note}”
          </p>
        )}
      </CardContent>
    </Card>
  );
}
