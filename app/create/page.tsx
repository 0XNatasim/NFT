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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  Globe,
  Loader2,
  Lock,
  ShoppingCart,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NFTCard } from "@/components/trade/nft-card";
import { OwnedNFTPicker } from "@/components/trade/owned-nft-picker";
import { FeeBreakdown } from "@/components/trade/fee-breakdown";
import { EmptyState } from "@/components/empty-state";
import { MONAD_CHAIN_ID, SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import { bufferedGas } from "@/lib/chains/gas";
import { erc721Abi, settlementAbi } from "@/lib/contracts/settlement";
import { FEATURED_COLLECTIONS } from "@/lib/featured-collections";
import { CollectionButton } from "@/components/trade/collection-button";
// useWalletNFTs replaced by OwnedNFTPicker (full pagination + collection filter)
import {
  generateNonce,
  getOrderDomain,
  ORDER_TYPES,
  ZERO_ADDRESS,
} from "@/lib/orders/eip712";
import { COLLECTION_BID_TOKEN_ID } from "@/lib/collection-bids";
import { formatMon } from "@/lib/utils";
import type { NFTAsset } from "@/lib/types";

const EXPIRY_OPTIONS = [
  { label: "1 hour", seconds: 3600 },
  { label: "24 hours", seconds: 86400 },
  { label: "7 days", seconds: 604800 },
  { label: "30 days", seconds: 2592000 },
];

/** What the maker wants to do — drives which inputs appear. */
type Intent = "sell" | "buy" | "swap" | "custom";

const INTENTS: {
  id: Intent;
  title: string;
  blurb: string;
  icon: typeof Tag;
}[] = [
  {
    id: "sell",
    title: "Sell NFTs for MON",
    blurb: "List NFTs and receive MON in return.",
    icon: Tag,
  },
  {
    id: "buy",
    title: "Buy an NFT with MON",
    blurb: "Offer MON for NFTs you want.",
    icon: ShoppingCart,
  },
  {
    id: "swap",
    title: "Swap NFTs for NFTs",
    blurb: "Trade NFTs directly for other non-fungible tokens.",
    icon: Sparkles,
  },
  {
    id: "custom",
    title: "Custom Trade",
    blurb: "Offer both NFTs and MON for more control.",
    icon: Coins,
  },
];

type Visibility = "public" | "targeted" | "private";

const VISIBILITIES: {
  id: Visibility;
  title: string;
  blurb: string;
  icon: typeof Globe;
}[] = [
  {
    id: "public",
    title: "Public — anyone can accept",
    blurb: "Listed on the open feed. The first matching wallet can fill it.",
    icon: Globe,
  },
  {
    id: "targeted",
    title: "Reserved for one wallet",
    blurb:
      "Still listed publicly, but only the wallet you name is allowed to accept.",
    icon: Users,
  },
  {
    id: "private",
    title: "Private / unlisted",
    blurb:
      "Hidden from the public feed. Only the wallet you name (with the link) can see and accept it.",
    icon: Lock,
  },
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

  const prefilledTaker = searchParams.get("taker") ?? "";
  const prefilledPrivate =
    searchParams.get("private") === "1" && isAddress(prefilledTaker);

  // Wizard state
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [visibility, setVisibility] = useState<Visibility>(
    prefilledPrivate ? "private" : isAddress(prefilledTaker) ? "targeted" : "public"
  );

  const [offeredNfts, setOfferedNfts] = useState<NFTAsset[]>([]);
  const [requestedNfts, setRequestedNfts] = useState<NFTAsset[]>([]);
  const [offeredMon, setOfferedMon] = useState("");
  const [requestedMon, setRequestedMon] = useState("");
  const [takerAddress, setTakerAddress] = useState(
    isAddress(prefilledTaker) ? prefilledTaker : ""
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

  // Which inputs are relevant for the chosen intent.
  const offersNft = intent === "sell" || intent === "swap" || intent === "custom";
  const offersMon = intent === "buy" || intent === "custom";
  const requestsNft = intent === "buy" || intent === "swap" || intent === "custom";
  const requestsMon = intent === "sell" || intent === "custom";

  const hasOfferedSomething = offeredNfts.length > 0 || makerMonWei > 0n;
  const hasRequestedSomething = requestedNfts.length > 0 || takerMonWei > 0n;
  const isPrivate = visibility === "private";
  const needsTaker = visibility === "targeted" || visibility === "private";

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
    const collection = FEATURED_COLLECTIONS.find(
      (c) => c.address.toLowerCase() === requestContract.toLowerCase()
    );
    const isCollectionWideBuy = intent === "buy" && requestTokenId.trim() === "";
    if (!isCollectionWideBuy && !/^\d+$/.test(requestTokenId)) {
      toast.error("Enter a numeric token ID");
      return;
    }
    const nft: NFTAsset = {
      contractAddress: requestContract.toLowerCase(),
      tokenId: isCollectionWideBuy ? COLLECTION_BID_TOKEN_ID : requestTokenId,
      tokenStandard: "ERC721",
      name: isCollectionWideBuy
        ? `Any ${collection?.name ?? "collection"} NFT`
        : `#${requestTokenId}`,
      collectionName: collection?.name ?? null,
      imageUrl: isCollectionWideBuy ? (collection?.logo ?? null) : null,
      metadata: isCollectionWideBuy ? { collectionBid: true } : null,
    };
    if (requestedNfts.some((n) => nftKey(n) === nftKey(nft))) return;
    setRequestedNfts((prev) => [...prev, nft]);
    setRequestContract("");
    setRequestTokenId("");
    if (isCollectionWideBuy) {
      toast.success(
        `Added a collection-wide buy request for ${
          nft.collectionName ?? "this collection"
        }`
      );
      return;
    }
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
      setOfferedNfts((prev) => (prev.length < 20 ? [...prev, nft] : prev));
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

  function goNext() {
    if (step === 0) {
      if (!intent) {
        toast.error("Pick what you'd like to do");
        return;
      }
    }
    if (step === 1) {
      if (!hasOfferedSomething) {
        toast.error("Add something to your side of the trade");
        return;
      }
      if (!hasRequestedSomething) {
        toast.error("Add what you want in return");
        return;
      }
    }
    if (step === 2) {
      if (needsTaker && !isAddress(takerAddress)) {
        toast.error("Enter a valid wallet address for this offer");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSign() {
    if (!address) return;
    if (chainId !== MONAD_CHAIN_ID) {
      toast.error("Switch to the Monad network first");
      return;
    }
    if (!hasOfferedSomething || !hasRequestedSomething) {
      toast.error("Your trade is incomplete");
      return;
    }
    if (needsTaker && !isAddress(takerAddress)) {
      toast.error("This offer needs a valid taker wallet address");
      return;
    }
    if (
      SETTLEMENT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
    ) {
      toast.error("Settlement contract is not configured");
      return;
    }

    setSubmitting(true);
    try {
      // Approve the settlement contract for the offered NFTs so the order is
      // instantly fillable. One approval tx per collection.
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
            const approveParams = {
              address: contract as Address,
              abi: erc721Abi,
              functionName: "setApprovalForAll" as const,
              args: [SETTLEMENT_CONTRACT_ADDRESS, true] as const,
            };
            const gas = await bufferedGas(publicClient, {
              ...approveParams,
              account: address,
            });
            const hash = await writeContractAsync({ ...approveParams, gas });
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
      const effectiveTaker = needsTaker ? takerAddress.toLowerCase() : "";
      const taker = (effectiveTaker || ZERO_ADDRESS) as Address;

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
          takerAddress: effectiveTaker || null,
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

  const steps = ["Type", "Details", "Visibility", "Review"];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Create a trade</h1>

      <Stepper steps={steps} current={step} onJump={(i) => i < step && setStep(i)} />

      <div className="mt-8">
        {step === 0 && (
          <StepIntent intent={intent} onPick={setIntent} />
        )}

        {step === 1 && (
          <StepDetails
            intent={intent!}
            offersNft={offersNft}
            offersMon={offersMon}
            requestsNft={requestsNft}
            requestsMon={requestsMon}
            offeredNfts={offeredNfts}
            requestedNfts={requestedNfts}
            toggleOffered={toggleOffered}
            offeredMon={offeredMon}
            setOfferedMon={setOfferedMon}
            requestedMon={requestedMon}
            setRequestedMon={setRequestedMon}
            makerMonWei={makerMonWei}
            requestContract={requestContract}
            setRequestContract={setRequestContract}
            requestTokenId={requestTokenId}
            setRequestTokenId={setRequestTokenId}
            addRequestedNft={addRequestedNft}
            setRequestedNfts={setRequestedNfts}
            offerContract={offerContract}
            setOfferContract={setOfferContract}
            offerTokenId={offerTokenId}
            setOfferTokenId={setOfferTokenId}
            addingOffered={addingOffered}
            addOfferedNftManually={addOfferedNftManually}
          />
        )}

        {step === 2 && (
          <StepVisibility
            visibility={visibility}
            onPick={setVisibility}
            takerAddress={takerAddress}
            setTakerAddress={setTakerAddress}
            needsTaker={needsTaker}
            expirySeconds={expirySeconds}
            setExpirySeconds={setExpirySeconds}
          />
        )}

        {step === 3 && (
          <StepReview
            intent={intent!}
            offeredNfts={offeredNfts}
            requestedNfts={requestedNfts}
            makerMonWei={makerMonWei}
            takerMonWei={takerMonWei}
            visibility={visibility}
            takerAddress={takerAddress}
            expirySeconds={expirySeconds}
          />
        )}
      </div>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={step === 0 || submitting}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 3 ? (
          <Button onClick={goNext}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" disabled={submitting} onClick={handleSign}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Waiting for signature…
              </>
            ) : (
              "Sign order (free, no gas)"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                              */
/* ------------------------------------------------------------------ */

function Stepper({
  steps,
  current,
  onJump,
}: {
  steps: string[];
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => onJump(i)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span
              className={`hidden text-sm sm:inline ${
                active ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="mx-1 h-px flex-1 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepIntent({
  intent,
  onPick,
}: {
  intent: Intent | null;
  onPick: (i: Intent) => void;
}) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">Choose a trade type</h2>
      <p className="mb-6 text-sm text-foreground">
        Choose a type of trade, and we&apos;ll only ask for the details that matter.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {INTENTS.map((opt) => {
          const Icon = opt.icon;
          const selected = intent === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPick(opt.id)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? "border-monad-purple bg-monad-purple/15 shadow-lg shadow-monad-purple/10 ring-1 ring-monad-purple"
                  : "border-monad-purple/30 bg-monad-purple/5 hover:border-monad-purple hover:bg-monad-purple/10"
              }`}
            >
              <span
                className={`mt-0.5 rounded-lg p-2 ${
                  selected ? "bg-monad-purple text-monad-black" : "bg-monad-purple/15 text-monad-purple"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-medium">{opt.title}</span>
                <span className="block text-sm text-foreground">
                  {opt.blurb}
                </span>
              </span>
              {selected && <Check className="ml-auto h-5 w-5 text-monad-purple" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDetails(props: {
  intent: Intent;
  offersNft: boolean;
  offersMon: boolean;
  requestsNft: boolean;
  requestsMon: boolean;
  offeredNfts: NFTAsset[];
  requestedNfts: NFTAsset[];
  toggleOffered: (n: NFTAsset) => void;
  offeredMon: string;
  setOfferedMon: (v: string) => void;
  requestedMon: string;
  setRequestedMon: (v: string) => void;
  makerMonWei: bigint;
  requestContract: string;
  setRequestContract: (v: string) => void;
  requestTokenId: string;
  setRequestTokenId: (v: string) => void;
  addRequestedNft: () => void;
  setRequestedNfts: React.Dispatch<React.SetStateAction<NFTAsset[]>>;
  offerContract: string;
  setOfferContract: (v: string) => void;
  offerTokenId: string;
  setOfferTokenId: (v: string) => void;
  addingOffered: boolean;
  addOfferedNftManually: () => void;
}) {
  const {
    offersNft,
    offersMon,
    requestsNft,
    requestsMon,
    offeredNfts,
    requestedNfts,
    toggleOffered,
    offeredMon,
    setOfferedMon,
    requestedMon,
    setRequestedMon,
    makerMonWei,
    requestContract,
    setRequestContract,
    requestTokenId,
    setRequestTokenId,
    addRequestedNft,
    setRequestedNfts,
    offerContract,
    setOfferContract,
    offerTokenId,
    setOfferTokenId,
    addingOffered,
    addOfferedNftManually,
  } = props;
  const canAddOfferedNft =
    isAddress(offerContract) && /^\d+$/.test(offerTokenId) && !addingOffered;
  const canAddRequestedNft =
    isAddress(requestContract) &&
    (/^\d+$/.test(requestTokenId) ||
      (props.intent === "buy" && requestTokenId.trim() === ""));

  return (
    <div className="space-y-6">
      {/* ---- You give ---- */}
      <Card>
        <CardHeader>
          <CardTitle>You give</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {offersNft && (
            <>
              <p className="text-sm text-muted-foreground">
                Your NFTs ({offeredNfts.length} selected, max 20) — pick a
                collection on the left, then tap to add/remove.
              </p>
              <OwnedNFTPicker selected={offeredNfts} onToggle={toggleOffered} />
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
                    variant={canAddOfferedNft ? "default" : "secondary"}
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
            </>
          )}
          {offersMon && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                MON you give
              </label>
              <Input
                placeholder="0.0"
                inputMode="decimal"
                value={offeredMon}
                onChange={(e) => setOfferedMon(e.target.value)}
              />
              {makerMonWei > 0n && (
                <p className="mt-1.5 text-xs text-amber-400">
                  MON you offer must be deposited (plus the protocol fee) into
                  the settlement escrow before the trade can be accepted. You
                  control the escrow and can withdraw anytime.
                </p>
              )}
            </div>
          )}
          {!offersNft && !offersMon && (
            <p className="text-sm text-muted-foreground">
              Nothing to configure here for this trade type.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---- You get ---- */}
      <Card>
        <CardHeader>
          <CardTitle>You get</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsNft && (
            <>
              <p className="text-sm text-muted-foreground">
                The NFT(s) you want, by contract + token ID. For buy trades,
                select a collection and leave Token ID empty to offer MON for
                any NFT in that collection; holders can answer with a private
                offer.
              </p>
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
                  placeholder={
                    props.intent === "buy" ? "Token ID (optional)" : "Token ID"
                  }
                  className="w-32"
                  value={requestTokenId}
                  onChange={(e) => setRequestTokenId(e.target.value)}
                />
                <Button
                  type="button"
                  variant={canAddRequestedNft ? "default" : "secondary"}
                  onClick={addRequestedNft}
                >
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
            </>
          )}
          {requestsMon && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepVisibility({
  visibility,
  onPick,
  takerAddress,
  setTakerAddress,
  needsTaker,
  expirySeconds,
  setExpirySeconds,
}: {
  visibility: Visibility;
  onPick: (v: Visibility) => void;
  takerAddress: string;
  setTakerAddress: (v: string) => void;
  needsTaker: boolean;
  expirySeconds: number;
  setExpirySeconds: (v: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold">Who can see and accept it?</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Control whether the offer is public, reserved, or hidden.
        </p>
        <div className="grid gap-3">
          {VISIBILITIES.map((opt) => {
            const Icon = opt.icon;
            const selected = visibility === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onPick(opt.id)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-secondary/40"
                }`}
              >
                <span
                  className={`mt-0.5 rounded-lg p-2 ${
                    selected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium">{opt.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {opt.blurb}
                  </span>
                </span>
                {selected && <Check className="ml-auto h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>
        {needsTaker && (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">
              Wallet allowed to accept
            </label>
            <Input
              placeholder="0x… the counterparty's wallet"
              value={takerAddress}
              onChange={(e) => setTakerAddress(e.target.value)}
            />
            {takerAddress && !isAddress(takerAddress) && (
              <p className="mt-1 text-xs text-red-400">Not a valid address</p>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}

function StepReview({
  intent,
  offeredNfts,
  requestedNfts,
  makerMonWei,
  takerMonWei,
  visibility,
  takerAddress,
  expirySeconds,
}: {
  intent: Intent;
  offeredNfts: NFTAsset[];
  requestedNfts: NFTAsset[];
  makerMonWei: bigint;
  takerMonWei: bigint;
  visibility: Visibility;
  takerAddress: string;
  expirySeconds: number;
}) {
  const intentLabel = INTENTS.find((i) => i.id === intent)?.title ?? "Trade";
  const visLabel = VISIBILITIES.find((v) => v.id === visibility)?.title ?? "";
  const expiryLabel =
    EXPIRY_OPTIONS.find((e) => e.seconds === expirySeconds)?.label ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Review &amp; sign</h2>
        <Card>
          <CardContent className="space-y-4 p-5">
            <ReviewRow label="Trade type" value={intentLabel} />
            <div className="grid gap-3 sm:grid-cols-2">
              <ReviewSide
                title="You give"
                nfts={offeredNfts}
                mon={makerMonWei}
              />
              <ReviewSide
                title="You get"
                nfts={requestedNfts}
                mon={takerMonWei}
              />
            </div>
            <ReviewRow label="Visibility" value={visLabel} />
            {(visibility === "targeted" || visibility === "private") && (
              <ReviewRow
                label="Reserved for"
                value={
                  isAddress(takerAddress)
                    ? `${takerAddress.slice(0, 8)}…${takerAddress.slice(-4)}`
                    : "—"
                }
              />
            )}
            <ReviewRow label="Expires in" value={expiryLabel} />
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Signing creates an off-chain order — free, no gas. Nothing moves until
          a counterparty settles on-chain. You can cancel anytime with an
          on-chain cancellation.
        </p>
      </div>
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <FeeBreakdown makerMonAmount={makerMonWei} takerMonAmount={takerMonWei} />
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ReviewSide({
  title,
  nfts,
  mon,
}: {
  title: string;
  nfts: NFTAsset[];
  mon: bigint;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {nfts.length === 0 && mon === 0n && (
        <p className="text-sm text-muted-foreground">Nothing</p>
      )}
      {nfts.map((n) => (
        <p key={nftKey(n)} className="truncate text-sm">
          {n.name ?? `#${n.tokenId}`}{" "}
          <span className="text-muted-foreground">
            ({n.contractAddress.slice(0, 8)}…)
          </span>
        </p>
      ))}
      {mon > 0n && (
        <p className="text-sm font-semibold text-monad-purple">
          + {formatMon(mon)} MON
        </p>
      )}
    </div>
  );
}
