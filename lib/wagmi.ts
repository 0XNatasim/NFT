"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { monad, MONAD_RPC_URL } from "@/lib/chains/monad";

// Show the Monad logo as the chain icon in the wallet/connect button.
const monadWithIcon = {
  ...monad,
  iconUrl: "/monad-logo.svg",
  iconBackground: "#0E100F",
};

export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Handshake",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "handshake-dev",
  chains: [monadWithIcon],
  transports: {
    [monad.id]: http(MONAD_RPC_URL),
  },
  ssr: true,
});
