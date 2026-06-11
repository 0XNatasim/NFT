"use client";

import { useAccount } from "wagmi";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/trade/offer-card";
import { NFTCard } from "@/components/trade/nft-card";
import { EmptyState } from "@/components/empty-state";
import { useOffers, useReputation, useWalletNFTs } from "@/hooks/use-market";
import { shortAddress } from "@/lib/utils";

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const { data: nfts, isLoading: loadingNfts } = useWalletNFTs(address);
  const { data: offers, isLoading: loadingOffers } = useOffers({
    wallet: address,
    limit: 100,
  });
  const { data: reputation } = useReputation(address);

  if (!isConnected || !address) {
    return (
      <div className="container mx-auto px-4 py-20">
        <EmptyState
          title="Connect your wallet"
          body="Connect a wallet to see your NFTs, offers and trade history."
        />
      </div>
    );
  }

  const me = address.toLowerCase();
  const allOpen = offers?.filter((o) => o.status === "open") ?? [];
  const incoming = allOpen.filter(
    (o) => o.takerAddress?.toLowerCase() === me && o.makerAddress.toLowerCase() !== me
  );
  const open = allOpen.filter((o) => o.makerAddress.toLowerCase() === me);
  const completed = offers?.filter((o) => o.status === "completed") ?? [];
  const cancelled = offers?.filter((o) => o.status === "cancelled") ?? [];

  return (
    <div className="container mx-auto space-y-12 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">{shortAddress(address)}</h1>
        <div className="mt-4 grid max-w-2xl grid-cols-3 gap-4">
          <StatCard label="Completed trades" value={reputation?.completedTradesCount ?? 0} />
          <StatCard label="Cancelled offers" value={reputation?.cancelledTradesCount ?? 0} />
          <StatCard
            label="Last trade"
            value={
              reputation?.lastTradeAt
                ? format(new Date(reputation.lastTradeAt), "MMM d, yyyy")
                : "—"
            }
          />
        </div>
      </div>

      {incoming.length > 0 && (
        <Section title={`Offers for you (${incoming.length})`} loading={loadingOffers}>
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            These trades are reserved for your wallet. Open one to review and accept.
          </p>
          <OfferGrid offers={incoming} />
        </Section>
      )}

      <Section title={`My open offers (${open.length})`} loading={loadingOffers}>
        {open.length > 0 ? (
          <OfferGrid offers={open} />
        ) : (
          <EmptyState title="No open offers" body="Create a trade to get started." />
        )}
      </Section>

      <Section title={`Completed trades (${completed.length})`} loading={loadingOffers}>
        {completed.length > 0 ? (
          <OfferGrid offers={completed} />
        ) : (
          <EmptyState title="No completed trades yet" body="Settled trades appear here." />
        )}
      </Section>

      <Section title={`Cancelled offers (${cancelled.length})`} loading={loadingOffers}>
        {cancelled.length > 0 ? (
          <OfferGrid offers={cancelled} />
        ) : (
          <EmptyState title="No cancelled offers" body="Cancelled offers appear here." />
        )}
      </Section>

      <Section title="My NFTs" loading={loadingNfts}>
        {nfts && nfts.nfts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
            {nfts.nfts.map((nft) => (
              <NFTCard key={`${nft.contractAddress}:${nft.tokenId}`} nft={nft} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No NFTs found"
            body="We couldn't find ERC-721 NFTs in this wallet on Monad."
          />
        )}
      </Section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xl font-bold text-monad-purple">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  loading,
  children,
}: {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function OfferGrid({ offers }: { offers: any[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}
