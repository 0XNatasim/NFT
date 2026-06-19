"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { MONAD_CHAIN_ID } from "@/lib/chains/monad";
import { Button } from "@/components/ui/button";

/** Banner shown whenever the connected wallet is on the wrong network. */
export function NetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === MONAD_CHAIN_ID) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <p className="text-sm text-amber-300">
          You are connected to the wrong network. Handshake settles trades on
          Monad (chain {MONAD_CHAIN_ID}).
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => switchChain({ chainId: MONAD_CHAIN_ID })}
        >
          {isPending ? "Switching…" : "Switch to Monad"}
        </Button>
      </div>
    </div>
  );
}
