"use client";

import { use, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { type Address } from "viem";
import { toast } from "sonner";
import { ArrowLeftRight, ExternalLink, Loader2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NFTCard } from "@/components/trade/nft-card";
import { FeeBreakdown } from "@/components/trade/fee-breakdown";
import { EmptyState } from "@/components/empty-state";
import { useOffer } from "@/hooks/use-market";
import {
  explorerTxUrl,
  MONAD_CHAIN_ID,
  SETTLEMENT_CONTRACT_ADDRESS,
} from "@/lib/chains/monad";
import { erc721Abi, settlementAbi } from "@/lib/contracts/settlement";
import { ZERO_ADDRESS } from "@/lib/orders/eip712";
import { quoteFees } from "@/lib/fees";
import { formatMon, shortAddress, timeUntil } from "@/lib/utils";
import type { TradeOffer } from "@/lib/types";

const statusVariant = {
  open: "default",
  completed: "success",
  cancelled: "destructive",
  expired: "warning",
} as const;

export default function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: offer, isLoading, refetch } = useOffer(id);
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [working, setWorking] = useState<"accept" | "cancel" | null>(null);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="mb-6 h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  if (!offer) {
    return (
      <div className="container mx-auto px-4 py-20">
        <EmptyState title="Offer not found" body="This trade offer does not exist." />
      </div>
    );
  }

  const makerNfts = offer.nfts.filter((n) => n.side === "maker");
  const takerNfts = offer.nfts.filter((n) => n.side === "taker");
  const makerMon = BigInt(offer.makerMonAmount);
  const takerMon = BigInt(offer.takerMonAmount);
  const isMaker = address?.toLowerCase() === offer.makerAddress.toLowerCase();
  const isDesignatedTaker =
    !offer.takerAddress || address?.toLowerCase() === offer.takerAddress.toLowerCase();
  const isExpired = offer.expiry * 1000 < Date.now();
  const canAccept =
    offer.status === "open" && !isMaker && isDesignatedTaker && !isExpired && !!address;

  function buildOrder(o: TradeOffer) {
    return {
      maker: o.makerAddress as Address,
      taker: (o.takerAddress ?? ZERO_ADDRESS) as Address,
      makerNFTs: o.nfts
        .filter((n) => n.side === "maker")
        .map((n) => ({
          contractAddress: n.contractAddress as Address,
          tokenId: BigInt(n.tokenId),
        })),
      takerNFTs: o.nfts
        .filter((n) => n.side === "taker")
        .map((n) => ({
          contractAddress: n.contractAddress as Address,
          tokenId: BigInt(n.tokenId),
        })),
      makerMonAmount: BigInt(o.makerMonAmount),
      takerMonAmount: BigInt(o.takerMonAmount),
      nonce: BigInt(o.nonce),
      expiry: BigInt(o.expiry),
    };
  }

  async function ensureApprovals(o: TradeOffer) {
    if (!publicClient || !address) return;
    const contracts = Array.from(
      new Set(
        o.nfts
          .filter((n) => n.side === "taker")
          .map((n) => n.contractAddress.toLowerCase())
      )
    );
    for (const contract of contracts) {
      const approved = await publicClient.readContract({
        address: contract as Address,
        abi: erc721Abi,
        functionName: "isApprovedForAll",
        args: [address, SETTLEMENT_CONTRACT_ADDRESS],
      });
      if (!approved) {
        toast.info(`Approving ${shortAddress(contract)} for settlement…`);
        const hash = await writeContractAsync({
          address: contract as Address,
          abi: erc721Abi,
          functionName: "setApprovalForAll",
          args: [SETTLEMENT_CONTRACT_ADDRESS, true],
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }
    }
  }

  async function handleAccept() {
    if (!offer || !publicClient || !address) return;
    if (chainId !== MONAD_CHAIN_ID) {
      toast.error("Switch to the Monad network first");
      return;
    }
    setWorking("accept");
    try {
      await ensureApprovals(offer);

      const [feeBps, flatSwapFee] = await Promise.all([
        publicClient.readContract({
          address: SETTLEMENT_CONTRACT_ADDRESS,
          abi: settlementAbi,
          functionName: "feeBps",
        }),
        publicClient.readContract({
          address: SETTLEMENT_CONTRACT_ADDRESS,
          abi: settlementAbi,
          functionName: "flatSwapFee",
        }),
      ]);
      const quote = quoteFees(makerMon, takerMon, feeBps, flatSwapFee);

      const hash = await writeContractAsync({
        address: SETTLEMENT_CONTRACT_ADDRESS,
        abi: settlementAbi,
        functionName: "fulfillTrade",
        args: [buildOrder(offer), offer.signature as `0x${string}`],
        value: quote.takerPays,
      });
      toast.info("Settling trade on-chain…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Settlement reverted");

      const res = await fetch(`/api/offers/${offer.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, takerAddress: address }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Trade settled but status update failed");
      }
      toast.success("Trade settled 🎉");
      refetch();
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Failed to settle trade");
    } finally {
      setWorking(null);
    }
  }

  async function handleCancel() {
    if (!offer || !publicClient || !address) return;
    if (chainId !== MONAD_CHAIN_ID) {
      toast.error("Switch to the Monad network first");
      return;
    }
    setWorking("cancel");
    try {
      const hash = await writeContractAsync({
        address: SETTLEMENT_CONTRACT_ADDRESS,
        abi: settlementAbi,
        functionName: "cancelNonce",
        args: [BigInt(offer.nonce)],
      });
      toast.info("Cancelling on-chain…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Cancellation reverted");

      const res = await fetch(`/api/offers/${offer.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, walletAddress: address }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Cancelled on-chain but status update failed");
      }
      toast.success("Offer cancelled");
      refetch();
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Failed to cancel");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Trade offer</h1>
        <Badge variant={statusVariant[offer.status]}>{offer.status}</Badge>
        {offer.isPrivate && (
          <Badge variant="secondary">
            <Lock className="mr-1 h-3 w-3" /> private
          </Badge>
        )}
        {offer.status === "open" && !isExpired && (
          <span className="text-sm text-muted-foreground">
            expires in {timeUntil(offer.expiry)}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
          <SideCard
            title={`Maker offers — ${shortAddress(offer.makerAddress)}`}
            nfts={makerNfts}
            mon={makerMon}
          />
          <div className="flex justify-center pt-10">
            <ArrowLeftRight className="h-6 w-6 text-monad-purple" />
          </div>
          <SideCard
            title={
              offer.takerAddress
                ? `Taker provides — ${shortAddress(offer.takerAddress)}`
                : "Taker provides — anyone"
            }
            nfts={takerNfts}
            mon={takerMon}
          />
        </div>

        <div className="space-y-4">
          <FeeBreakdown makerMonAmount={makerMon} takerMonAmount={takerMon} />

          {canAccept && (
            <Button
              className="w-full"
              size="lg"
              disabled={working !== null}
              onClick={handleAccept}
            >
              {working === "accept" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Settling…
                </>
              ) : (
                "Accept trade"
              )}
            </Button>
          )}
          {isMaker && offer.status === "open" && (
            <Button
              className="w-full"
              variant="destructive"
              disabled={working !== null}
              onClick={handleCancel}
            >
              {working === "cancel" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cancelling…
                </>
              ) : (
                "Cancel offer (on-chain)"
              )}
            </Button>
          )}
          {!address && offer.status === "open" && (
            <p className="text-sm text-muted-foreground">
              Connect your wallet to accept this trade.
            </p>
          )}
          {offer.completedTxHash && (
            <TxLink label="Settlement transaction" hash={offer.completedTxHash} />
          )}
          {offer.cancelledTxHash && (
            <TxLink label="Cancellation transaction" hash={offer.cancelledTxHash} />
          )}
        </div>
      </div>
    </div>
  );
}

function SideCard({
  title,
  nfts,
  mon,
}: {
  title: string;
  nfts: TradeOffer["nfts"];
  mon: bigint;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {nfts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {nfts.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No NFTs</p>
        )}
        {mon > 0n && (
          <p className="text-lg font-semibold text-monad-purple">
            + {formatMon(mon)} MON
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TxLink({ label, hash }: { label: string; hash: string }) {
  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 text-sm text-monad-purple hover:underline"
    >
      {label} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
