"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useRoomSession } from "@/hooks/use-deal-rooms";

/**
 * Prompts the one-time Deal Room sign-in signature right after a wallet
 * connects, so users land on the Handshake pages already signed in to their
 * Deal Rooms instead of hitting a sign-in wall the first time they open one.
 *
 * The signature only proves wallet ownership — the signed message says so, and
 * nothing can move without a later EIP-712 order signature. A session lasts
 * 24h, so we skip the prompt whenever a valid one is already stored, and we
 * only auto-prompt once per connected wallet: a dismissed prompt can be retried
 * from the toast or from any Deal Room action.
 */
export function DealRoomAutoSignIn() {
  const { address, isConnected } = useAccount();
  const { hasSession, ensureSession } = useRoomSession();
  const promptedFor = useRef<string | null>(null);

  useEffect(() => {
    const wallet = address?.toLowerCase() ?? null;

    // Reset on disconnect so a fresh connection re-prompts.
    if (!isConnected || !wallet) {
      promptedFor.current = null;
      return;
    }

    // Already signed in, or we've already asked this wallet this session.
    if (hasSession || promptedFor.current === wallet) return;

    // Give useRoomSession a beat to load any stored token before prompting, so
    // a returning user with a live 24h session is never asked to sign again.
    const timer = setTimeout(() => {
      if (promptedFor.current === wallet || hasSession) return;
      promptedFor.current = wallet;

      const signIn = () =>
        ensureSession()
          .then(() => {
            toast.success("You're in — Deal Rooms unlocked");
          })
          .catch(() => {
            // Rejected or dismissed — let them try again and say why we asked.
            promptedFor.current = null;
            toast("Sign in to your Deal Rooms", {
              description:
                "Approve the wallet signature to enter. It only proves wallet ownership — it can't move any asset.",
              action: { label: "Sign in", onClick: () => void signIn() },
              duration: 12_000,
            });
          });

      // Tell them what the incoming signature is for.
      toast.message("Sign in to your Deal Rooms", {
        description:
          "Approve the wallet signature to enter — it only proves ownership, nothing moves.",
      });
      void signIn();
    }, 500);

    return () => clearTimeout(timer);
  }, [address, isConnected, hasSession, ensureSession]);

  return null;
}
