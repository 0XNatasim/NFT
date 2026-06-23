"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Handshake, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { FEATURED_COLLECTIONS } from "@/lib/featured-collections";
import {
  buildCreateWantedMessage,
  buildDeleteWantedMessage,
} from "@/lib/wanted/auth";

interface WantedPost {
  id: string;
  walletAddress: string;
  lookingFor: string;
  offering: string | null;
  notes: string | null;
  createdAt: string;
}

export default function WantedPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const [collection, setCollection] = useState(FEATURED_COLLECTIONS[0]?.name ?? "");
  const [rarity, setRarity] = useState("Any");
  const [offering, setOffering] = useState("");
  const [notes, setNotes] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["wanted"],
    queryFn: async () => {
      const res = await fetch("/api/wanted");
      if (!res.ok) throw new Error("Failed to load wanted board");
      return (await res.json()).posts as WantedPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect your wallet first");
      const timestamp = Date.now();
      const lookingForValue = `${rarity === "Any" ? "Any rarity" : rarity} ${collection}`;
      const offeringValue = offering || undefined;
      const notesValue = notes || undefined;
      const signature = await signMessageAsync({
        message: buildCreateWantedMessage({
          walletAddress: address,
          lookingFor: lookingForValue,
          offering: offeringValue,
          notes: notesValue,
          timestamp,
        }),
      });
      const res = await fetch("/api/wanted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          lookingFor: lookingForValue,
          offering: offeringValue,
          notes: notesValue,
          timestamp,
          signature,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to post");
    },
    onSuccess: () => {
      toast.success("Posted to the wanted board");
      setCollection(FEATURED_COLLECTIONS[0]?.name ?? "");
      setRarity("Any");
      setOffering("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["wanted"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      if (!address) throw new Error("Connect your wallet first");
      const timestamp = Date.now();
      const signature = await signMessageAsync({
        message: buildDeleteWantedMessage({
          walletAddress: address,
          id,
          timestamp,
        }),
      });
      const res = await fetch(`/api/wanted/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, timestamp, signature }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to delete");
    },
    onSuccess: () => {
      toast.success("Request removed");
      queryClient.invalidateQueries({ queryKey: ["wanted"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Wanted board</h1>
      <p className="mb-8 text-foreground">
        Post what you&apos;re hunting for. Posts are anonymous — if you can fill a
        request, send the poster a private offer and they&apos;ll see it on their
        dashboard.
      </p>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardHeader>
            <CardTitle>Post a request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-sm font-medium">
              Collection
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
              >
                {FEATURED_COLLECTIONS.map((c) => (
                  <option key={c.address} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Rarity
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
              >
                {["Any", "Common", "Uncommon", "Rare"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <Input
              placeholder="Offer… (e.g. 25 MON or 10kSquad #123)"
              value={offering}
              maxLength={280}
              onChange={(e) => setOffering(e.target.value)}
            />
            <Input
              placeholder="Notes (optional)"
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!isConnected || collection.trim().length < 2 || createPost.isPending}
              onClick={() => createPost.mutate()}
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Posting…
                </>
              ) : isConnected ? (
                "Post"
              ) : (
                "Connect wallet to post"
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : posts && posts.length > 0 ? (
            posts.map((post) => {
              const isMine =
                address?.toLowerCase() === post.walletAddress.toLowerCase();
              return (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        Anonymous trader
                        {isMine && <Badge variant="secondary">your post</Badge>}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="font-medium">
                      <span className="text-monad-purple">Looking for:</span>{" "}
                      {post.lookingFor}
                    </p>
                    {post.offering && (
                      <p className="text-sm">
                        <span className="text-emerald-400">Offering:</span>{" "}
                        {post.offering}
                      </p>
                    )}
                    {post.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {post.notes}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      {!isMine && (
                        <Link
                          href={`/create?taker=${post.walletAddress}&private=1`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <Handshake className="h-3.5 w-3.5" /> Make private offer
                        </Link>
                      )}
                      {isMine && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletePost.isPending}
                          onClick={() => deletePost.mutate(post.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState
              title="Nothing on the board"
              body="Be the first to post what you're looking for."
            />
          )}
        </div>
      </div>
    </div>
  );
}
