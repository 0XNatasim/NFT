import { createPublicClient, fallback, http } from "viem";
import { monad, MONAD_RPC_URLS } from "@/lib/chains/monad";

function serverRpcUrls(): string[] {
  const configured = (process.env.MONAD_RPC_URLS ?? process.env.MONAD_RPC_URL ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.startsWith("https://"));
  return Array.from(new Set([...configured, ...MONAD_RPC_URLS]));
}

export const publicClient = createPublicClient({
  chain: monad,
  transport: fallback(serverRpcUrls().map((url) => http(url))),
});
