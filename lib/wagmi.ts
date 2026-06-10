"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { monad, MONAD_RPC_URL } from "@/lib/chains/monad";

export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Monad Market",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "monad-market-dev",
  chains: [monad],
  transports: {
    [monad.id]: http(MONAD_RPC_URL),
  },
  ssr: true,
});
