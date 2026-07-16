"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Handshake, Loader2 } from "lucide-react";
import { isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { TermsEditor } from "@/components/deal-room/terms-editor";
import { useRoomMutations, useRoomSession } from "@/hooks/use-deal-rooms";
import { MONAD_CHAIN_ID } from "@/lib/chains/monad";
import { shortAddress } from "@/lib/utils";
import type { DealRoomRevision } from "@/lib/types";

/**
 * /rooms/new — start a negotiation from scratch: with a wanted-board poster
 * (?counterparty=0x…&wanted=<postId>) or any wallet you paste. The composer
 * is the same TermsEditor used inside rooms, seeded with an empty draft.
 */
function NewRoomInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { address, isConnected } = useAccount();
  const { ensureSession } = useRoomSession();
  const { createRoom } = useRoomMutations(null);

  const wantedPostId = search.get("wanted");
  const [counterparty, setCounterparty] = useState(
    search.get("counterparty") ?? ""
  );
  const [confirmed, setConfirmed] = useState(isAddress(counterparty));

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
  });

  if (!isConnected || !address) {
    return (
      <EmptyState
        title="Connect your wallet"
        body="You need a connected wallet to start a negotiation."
      />
    );
  }

  const me = address.toLowerCase();

  if (!confirmed) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <label className="block text-sm font-medium">
            Who do you want to trade with?
          </label>
          <Input
            placeholder="0x… wallet address"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value.trim())}
          />
          <Button
            disabled={
              !isAddress(counterparty) ||
              counterparty.toLowerCase() === me
            }
            onClick={() => setConfirmed(true)}
          >
            Continue
          </Button>
          {counterparty && counterparty.toLowerCase() === me && (
            <p className="text-xs text-amber-400">
              That&apos;s your own wallet.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const cp = counterparty.toLowerCase();

  // Empty seed draft: viewer is the maker, counterparty the taker. The
  // TermsEditor requires a change vs base, so both sides start blank.
  const base: DealRoomRevision = {
    id: "new",
    roomId: "new",
    revisionNumber: 0,
    proposedBy: me,
    makerAddress: me,
    takerAddress: cp,
    makerNFTs: [],
    takerNFTs: [],
    makerMonAmount: "0",
    takerMonAmount: "0",
    feeBps: config?.feeBps ?? 100,
    flatFee: "0",
    offerExpiry: Math.floor(Date.now() / 1000) + 86_400,
    termsHash: "",
    note: null,
    createdAt: new Date().toISOString(),
    acceptedBy: [],
  };

  return (
    <TermsEditor
      base={base}
      viewerWallet={me}
      submitting={createRoom.isPending}
      onClose={() => router.back()}
      onSubmit={async (draft, note) => {
        try {
          await ensureSession();
          const res = await createRoom.mutateAsync({
            chainId: MONAD_CHAIN_ID,
            counterparty: cp,
            sourceWantedPostId: wantedPostId,
            draft,
            note,
          });
          toast.success(`Deal Room opened with ${shortAddress(cp)}`);
          router.push(`/rooms/${res.room.id}`);
        } catch (err: any) {
          toast.error(err?.message ?? "Failed to open the room");
        }
      }}
    />
  );
}

export default function NewRoomPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <Handshake className="h-5 w-5 text-monad-purple" />
        Start a negotiation
      </h1>
      <p className="text-sm text-muted-foreground">
        Draft the opening terms — free, signature-less, and nothing can move
        until you both agree and sign at the end.
      </p>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <NewRoomInner />
      </Suspense>
    </div>
  );
}
