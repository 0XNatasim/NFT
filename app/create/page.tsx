"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useAccount,
  usePublicClient,
  useSignTypedData,
  useWriteContract,
} from "wagmi";
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
import { erc721Abi, settlementAbi } from "@/lib/contracts/settlement";
import { FEATURED_COLLECTIONS } from "@/lib/featured-collections";
import { CollectionButton } from "@/components/trade/collection-button";
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
  return (
    <Suspense fallback={null}>
      <CreateTradeForm />
    </Suspense>
  );
}

function CreateTradeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: walletNfts, isLoading } = useWalletNFTs(address);

  const prefilledTaker = searchParams.get("taker") ?? "";
  const [offeredNfts, setOfferedNfts] = useState<NFTAsset[]>([]);
  const [requestedNfts, setRequestedNfts] = useState<NFTAsset[]>([]);
  const [offeredMon, setOfferedMon] = useState("");
  const [requestedMon, setRequestedMon] = useState("");
  const [takerAddress, setTakerAddress] = useState(
    isAddress(prefilledTaker) ? prefilledTaker : ""
  );
  const [isPrivate, setIsPrivate] = useState(
    searchParams.get("private") === "1" && isAddress(prefilledTaker)
  );
  const [expirySeconds, setExpirySeconds] = useState(86400);
  const [requestContract, setRequestContract] = useState("");
  const [requestTokenId, setRequestTokenId] = useState("");
  const [offerContract, setOfferContract] = useState("");
  const [offerTokenId, setOfferTokenId] = useState("");
  const [addingOffered, setAddingOffered] = useState(false);
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
      collectionName:
        FEATURED_COLLECTIONS.find(
          (c) => c.address.toLowerCase() === requestContract.toLowerCase()
        )?.name ?? null,
      imageUrl: null,
    };
    if (requestedNfts.some((n) => nftKey(n) === nftKey(nft))) return;
    setRequestedNfts((prev) => [...prev, nft]);
    setRequestContract("");
    setRequestTokenId("");
    // Enrich asynchronously; update the entry in place when metadata lands.
    fetch(
      `/api/token-metadata?contract=${nft.contractAddress}&tokenId=${nft.tokenId}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((meta) => {
        if (!meta) return;
        setRequestedNfts((prev) =>
          prev.map((n) =>
            nftKey(n) === nftKey(nft)
              ? {
                  ...n,
                  name: meta.name ?? n.name,
                  imageUrl: meta.image ?? n.imageUrl,
                  collectionName: n.collectionName ?? meta.collectionName ?? null,
                }
              : n
          )
        );
      })
      .catch(() => {});
  }

  /** Add an NFT you own by contract + token ID, verified on-chain. */
  async function addOfferedNftManually() {
    if (!address || !publicClient) return;
    if (!isAddress(offerContract)) {
      toast.error("Enter a valid NFT contract address");
      return;
    }
    if (!/^\d+$/.test(offerTokenId)) {
      toast.error("Enter a numeric token ID");
      return;
    }
    const nft: NFTAsset = {
      contractAddress: offerContract.toLowerCase(),
      tokenId: offerTokenId,
      tokenStandard: "ERC721",
      name: `#${offerTokenId}`,
      collectionName:
        FEATURED_COLLECTIONS.find(
          (c) => c.address.toLowerCase() === offerContract.toLowerCase()
        )?.name ?? null,
      imageUrl: null,
    };
    if (offeredNfts.some((n) => nftKey(n) === nftKey(nft))) {
      toast.error("Already selected");
      return;
    }
    setAddingOffered(true);
    try {
      const owner = await publicClient.readContract({
        address: nft.contractAddress as Address,
        abi: erc721Abi,
        functionName: "ownerOf",
        args: [BigInt(nft.tokenId)],
      });
      if (owner.toLowerCase() !== address.toLowerCase()) {
        toast.error("You don't own this token");
        return;
      }
      // Indexer-independent metadata: tokenURI read on-chain server-side.
      try {
        const res = await fetch(
          `/api/token-metadata?contract=${nft.contractAddress}&tokenId=${nft.tokenId}`
        );
        if (res.ok) {
          const meta = await res.json();
          nft.name = meta.name ?? nft.name;
          nft.imageUrl = meta.image ?? null;
          nft.collectionName = nft.collectionName ?? meta.collectionName ?? null;
        }
      } catch {
        // metadata is cosmetic; proceed without it
      }
      setOfferedNfts((prev) =>
        prev.length < 20 ? [...prev, nft] : prev
      );
      setOfferTokenId("");
      toast.success(`Added ${nft.collectionName ?? "NFT"} #${nft.tokenId}`);
    } catch {
      toast.error(
        "Couldn't verify this token on-chain — check the contract address and token ID"
      );
    } finally {
      setAddingOffered(false);
    }
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
      // Make sure the settlement contract can move the offered NFTs, so the
      // offer is instantly fillable. One approval tx per collection.
      if (publicClient && offeredNfts.length > 0) {
        const contracts = Array.from(
          new Set(offeredNfts.map((n) => n.contractAddress.toLowerCase()))
        );
        for (const contract of contracts) {
          let approved: boolean;
          try {
            approved = await publicClient.readContract({
              address: contract as Address,
              abi: erc721Abi,
              functionName: "isApprovedForAll",
              args: [address, SETTLEMENT_CONTRACT_ADDRESS],
            });
          } catch {
            throw new Error(
              `Collection ${contract.slice(0, 10)}… doesn't exist on chain ${MONAD_CHAIN_ID}. ` +
                "Your NFT provider network and NEXT_PUBLIC_CHAIN_ID/RPC are probably pointing at different networks."
            );
          }
          if (!approved) {
            toast.info(
              "Approving this collection lets the settlement contract transfer its NFTs when a trade you signed executes (revocable anytime)."
            );
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

      // Bake the current protocol fee into the order so both parties sign the
      // exact fee — the owner can't change it on a signed order afterwards.
      let feeBps = 100n;
      let flatFee = 0n;
      if (publicClient) {
        [feeBps, flatFee] = await Promise.all([
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
      }

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
        feeBps,
        flatFee,
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
          feeBps: Number(feeBps),
          flatFee: flatFee.toString(),
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
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  NFT not showing? Add it by contract + token ID (ownership is
                  verified on-chain):
                </p>
                <div className="flex flex-wrap gap-2">
                  {FEATURED_COLLECTIONS.map((c) => (
                    <CollectionButton
                      key={c.address}
                      collection={c}
                      active={offerContract.toLowerCase() === c.address.toLowerCase()}
                      onClick={() => setOfferContract(c.address)}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="NFT contract address (0x…)"
                    value={offerContract}
                    onChange={(e) => setOfferContract(e.target.value)}
                  />
                  <Input
                    placeholder="Token ID"
                    className="w-32"
                    value={offerTokenId}
                    onChange={(e) => setOfferTokenId(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={addingOffered}
                    onClick={addOfferedNftManually}
                  >
                    {addingOffered ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>
              {offeredNfts.length > 0 && (
                <div className="space-y-1.5 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Selected ({offeredNfts.length})
                  </p>
                  {offeredNfts.map((nft) => (
                    <div
                      key={nftKey(nft)}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate">
                        {nft.name ?? `#${nft.tokenId}`}{" "}
                        <span className="text-muted-foreground">
                          ({nft.contractAddress.slice(0, 8)}…)
                        </span>
                      </span>
                      <button
                        type="button"
                        className="shrink-0 text-xs text-red-400 hover:underline"
                        onClick={() => toggleOffered(nft)}
                      >
                        remove
                      </button>
                    </div>
                  ))}
                </div>
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
              <div className="flex flex-wrap gap-2">
                {FEATURED_COLLECTIONS.map((c) => (
                  <CollectionButton
                    key={c.address}
                    collection={c}
                    active={requestContract.toLowerCase() === c.address.toLowerCase()}
                    onClick={() => setRequestContract(c.address)}
                  />
                ))}
              </div>
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
                Unlisted offer — hidden from the public feed, but anyone with the
                direct link can still view its terms
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
