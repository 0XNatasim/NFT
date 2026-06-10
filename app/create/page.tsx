"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignTypedData } from "wagmi";
import { parseEther, isAddress, type Address } from "viem";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NFTCard } from "@/components/trade/nft-card";
import { FeeBreakdown } from "@/components/trade/fee-breakdown";
import { EmptyState } from "@/components/empty-state";
import { useWalletNFTs } from "@/hooks/use-market";
import { MONAD_CHAIN_ID, SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import {
  generateNonce,
  getOrderDomain,
  ORDER_TYPES,
  ZERO_ADDRESS,
} from "@/lib/orders/eip712";
import type { NFTAsset } from "@/lib/types";

const EXPIRY_OPTIONS = [
  { label: "1 hour", seconds: 3600 },
  { label: "24 hours", seconds: 86400 },
  { label: "7 days", seconds: 604800 },
  { label: "30 days", seconds: 2592000 },
];

function nftKey(n: { contractAddress: string; tokenId: string }) {
  return `${n.contractAddress.toLowerCase()}:${n.tokenId}`;
}

export default function CreateTradePage() {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { data: walletNfts, isLoading } = useWalletNFTs(address);

  const [offeredNfts, setOfferedNfts] = useState<NFTAsset[]>([]);
  const [requestedNfts, setRequestedNfts] = useState<NFTAsset[]>([]);
  const [offeredMon, setOfferedMon] = useState("");
  const [requestedMon, setRequestedMon] = useState("");
  const [takerAddress, setTakerAddress] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(86400);
  const [requestContract, setRequestContract] = useState("");
  const [requestTokenId, setRequestTokenId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const makerMonWei = useMemo(() => {
    try {
      return offeredMon ? parseEther(offeredMon) : 0n;
    } catch {
      return 0n;
    }
  }, [offeredMon]);
  const takerMonWei = useMemo(() => {
    try {
      return requestedMon ? parseEther(requestedMon) : 0n;
    } catch {
      return 0n;
    }
  }, [requestedMon]);

  function toggleOffered(nft: NFTAsset) {
    setOfferedNfts((prev) =>
      prev.some((n) => nftKey(n) === nftKey(nft))
        ? prev.filter((n) => nftKey(n) !== nftKey(nft))
        : prev.length < 20
          ? [...prev, nft]
          : prev
    );
  }

  function addRequestedNft() {
    if (!isAddress(requestContract)) {
      toast.error("Enter a valid NFT contract address");
      return;
    }
    if (!/^\d+$/.test(requestTokenId)) {
      toast.error("Enter a numeric token ID");
      return;
    }
    const nft: NFTAsset = {
      contractAddress: requestContract.toLowerCase(),
      tokenId: requestTokenId,
      tokenStandard: "ERC721",
      name: `#${requestTokenId}`,
      collectionName: null,
      imageUrl: null,
    };
    if (requestedNfts.some((n) => nftKey(n) === nftKey(nft))) return;
    setRequestedNfts((prev) => [...prev, nft]);
    setRequestContract("");
    setRequestTokenId("");
  }

  async function handleSign() {
    if (!address) return;
    if (chainId !== MONAD_CHAIN_ID) {
      toast.error("Switch to the Monad network first");
      return;
    }
    if (offeredNfts.length === 0 && makerMonWei === 0n) {
      toast.error("Offer at least one NFT or some MON");
      return;
    }
    if (requestedNfts.length === 0 && takerMonWei === 0n) {
      toast.error("Request at least one NFT or some MON");
      return;
    }
    if (isPrivate && !isAddress(takerAddress)) {
      toast.error("Private offers need a valid taker wallet address");
      return;
    }
    if (takerAddress && !isAddress(takerAddress)) {
      toast.error("Taker address is invalid");
      return;
    }
    if (
      SETTLEMENT_CONTRACT_ADDRESS ===
      "0x0000000000000000000000000000000000000000"
    ) {
      toast.error("Settlement contract is not configured");
      return;
    }

    setSubmitting(true);
    try {
      const nonce = generateNonce();
      const expiry = BigInt(Math.floor(Date.now() / 1000) + expirySeconds);
      const taker = (takerAddress ? takerAddress.toLowerCase() : ZERO_ADDRESS) as Address;

      const order = {
        maker: address.toLowerCase() as Address,
        taker,
        makerNFTs: offeredNfts.map((n) => ({
          contractAddress: n.contractAddress as Address,
          tokenId: BigInt(n.tokenId),
        })),
        takerNFTs: requestedNfts.map((n) => ({
          contractAddress: n.contractAddress as Address,
          tokenId: BigInt(n.tokenId),
        })),
        makerMonAmount: makerMonWei,
        takerMonAmount: takerMonWei,
        nonce,
        expiry,
      };

      const signature = await signTypedDataAsync({
        domain: getOrderDomain(),
        types: ORDER_TYPES,
        primaryType: "TradeOrder",
        message: order,
      });

      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: MONAD_CHAIN_ID,
          makerAddress: address,
          takerAddress: takerAddress || null,
          makerNFTs: offeredNfts.map((n) => ({ ...n })),
          takerNFTs: requestedNfts.map((n) => ({ ...n })),
          makerMonAmount: makerMonWei.toString(),
          takerMonAmount: takerMonWei.toString(),
          nonce: nonce.toString(),
          expiry: Number(expiry),
          signature,
          isPrivate,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to create offer");

      toast.success("Trade offer created");
      router.push(`/offers/${body.offer.id}`);
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Failed to sign order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <EmptyState
          title="Connect your wallet"
          body="Connect a wallet to build a trade offer."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Create a trade</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* You offer */}
          <Card>
            <CardHeader>
              <CardTitle>You offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select NFTs from your wallet ({offeredNfts.length} selected, max 20)
              </p>
              {isLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : walletNfts && walletNfts.nfts.length > 0 ? (
                <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
                  {walletNfts.nfts.map((nft) => (
                    <NFTCard
                      key={nftKey(nft)}
                      nft={nft}
                      selected={offeredNfts.some((n) => nftKey(n) === nftKey(nft))}
                      onClick={() => toggleOffered(nft)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No NFTs found"
                  body="We couldn't find ERC-721 NFTs in this wallet on Monad."
                />
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  MON you add to your side
                </label>
                <Input
                  placeholder="0.0"
                  inputMode="decimal"
                  value={offeredMon}
                  onChange={(e) => setOfferedMon(e.target.value)}
                />
                {makerMonWei > 0n && (
                  <p className="mt-1.5 text-xs text-amber-400">
                    Offering MON requires depositing it (plus the 1% fee) into the
                    settlement escrow before the trade can be accepted. You control
                    the escrow and can withdraw anytime.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* You request */}
          <Card>
            <CardHeader>
              <CardTitle>You request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="NFT contract address (0x…)"
                  value={requestContract}
                  onChange={(e) => setRequestContract(e.target.value)}
                />
                <Input
                  placeholder="Token ID"
                  className="w-32"
                  value={requestTokenId}
                  onChange={(e) => setRequestTokenId(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={addRequestedNft}>
                  Add
                </Button>
              </div>
              {requestedNfts.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {requestedNfts.map((nft) => (
                    <NFTCard
                      key={nftKey(nft)}
                      nft={nft}
                      selected
                      onClick={() =>
                        setRequestedNfts((prev) =>
                          prev.filter((n) => nftKey(n) !== nftKey(nft))
                        )
                      }
                    />
                  ))}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  MON you want to receive
                </label>
                <Input
                  placeholder="0.0"
                  inputMode="decimal"
                  value={requestedMon}
                  onChange={(e) => setRequestedMon(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Specific taker wallet (optional)
                </label>
                <Input
                  placeholder="0x… leave empty for anyone"
                  value={takerAddress}
                  onChange={(e) => setTakerAddress(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 accent-[#836EF9]"
                />
                Private offer — hidden from the public feed, only visible via direct
                link and to the taker
              </label>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Expires in</label>
                <div className="flex flex-wrap gap-2">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <Button
                      key={opt.seconds}
                      type="button"
                      size="sm"
                      variant={expirySeconds === opt.seconds ? "default" : "secondary"}
                      onClick={() => setExpirySeconds(opt.seconds)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <FeeBreakdown makerMonAmount={makerMonWei} takerMonAmount={takerMonWei} />
          <Button
            className="w-full"
            size="lg"
            disabled={submitting}
            onClick={handleSign}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Waiting for signature…
              </>
            ) : (
              "Sign order (free, no gas)"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Signing creates an off-chain order. Nothing moves until a counterparty
            settles the trade on-chain. You can cancel anytime with an on-chain
            cancellation.
          </p>
        </div>
      </div>
    </div>
  );
}
