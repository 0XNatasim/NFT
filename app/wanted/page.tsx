"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { shortAddress } from "@/lib/utils";

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
  const queryClient = useQueryClient();
  const [lookingFor, setLookingFor] = useState("");
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
      const res = await fetch("/api/wanted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          lookingFor,
          offering: offering || undefined,
          notes: notes || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to post");
    },
    onSuccess: () => {
      toast.success("Posted to the wanted board");
      setLookingFor("");
      setOffering("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["wanted"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Wanted board</h1>
      <p className="mb-8 text-muted-foreground">
        Post what you&apos;re hunting for and what you&apos;re willing to part with.
        Negotiate, then send a private offer.
      </p>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardHeader>
            <CardTitle>Post a request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Looking for… (e.g. Monad Punks with laser eyes)"
              value={lookingFor}
              maxLength={280}
              onChange={(e) => setLookingFor(e.target.value)}
            />
            <Input
              placeholder="Offering… (optional)"
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
              disabled={!isConnected || lookingFor.trim().length < 2 || createPost.isPending}
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
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{shortAddress(post.walletAddress)}</span>
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="font-medium">
                    <span className="text-monad-purple">Looking for:</span>{" "}
                    {post.lookingFor}
                  </p>
                  {post.offering && (
                    <p className="text-sm">
                      <span className="text-emerald-400">Offering:</span> {post.offering}
                    </p>
                  )}
                  {post.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{post.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
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
