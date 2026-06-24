"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Handshake, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DISMISSED_KEY = "monad-market-welcome-dismissed";

export function WelcomeTutorial() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(DISMISSED_KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // localStorage unavailable; hide for this session only
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-lg border-monad-purple/25 shadow-2xl shadow-monad-purple/20">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss welcome tutorial"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <CardHeader>
          <CardTitle className="text-xl">Welcome to Monad Market</CardTitle>
          <p className="text-sm text-muted-foreground">
            Wallet-to-wallet NFT deals — no custody, no bots.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 text-sm">
            <Handshake className="mt-0.5 h-4 w-4 shrink-0 text-monad-purple" />
            <p>
              Browse open offers or create your own public or private deal for
              any supported collection.
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-monad-purple" />
            <p>
              Your NFTs stay in your wallet until both sides accept and the
              trade executes on Monad.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/create"
              onClick={dismiss}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-gradient-to-r from-monad-purple to-fuchsia-400 px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-monad-purple/20 transition-colors hover:from-monad-purple/90 hover:to-fuchsia-400/90"
            >
              Create a deal
            </Link>
            <Button variant="outline" className="flex-1" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
