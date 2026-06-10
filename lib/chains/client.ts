import { createPublicClient, http } from "viem";
import { monad, MONAD_RPC_URL } from "@/lib/chains/monad";

export const publicClient = createPublicClient({
  chain: monad,
  transport: http(process.env.MONAD_RPC_URL ?? MONAD_RPC_URL),
});
