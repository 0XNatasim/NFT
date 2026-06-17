import { defineChain } from "viem";

/**
 * Monad chain configuration. Everything is environment-driven so the same
 * build targets Monad Testnet today and Monad Mainnet at launch.
 */

const DEFAULT_TESTNET_ID = 10143;

export const MONAD_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_TESTNET_ID
);

export const MONAD_RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";

export const MONAD_EXPLORER_URL =
  process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ??
  "https://testnet.monadexplorer.com";

export const MON = {
  name: "Monad",
  symbol: "MON",
  decimals: 18,
} as const;

export const monad = defineChain({
  id: MONAD_CHAIN_ID,
  name: MONAD_CHAIN_ID === DEFAULT_TESTNET_ID ? "Monad Testnet" : "Monad",
  nativeCurrency: MON,
  rpcUrls: {
    default: { http: [MONAD_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: MONAD_EXPLORER_URL },
  },
  testnet: MONAD_CHAIN_ID === DEFAULT_TESTNET_ID,
});

export const SETTLEMENT_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export function explorerTxUrl(hash: string): string {
  return `${MONAD_EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${MONAD_EXPLORER_URL}/address/${address}`;
}

export function explorerTokenUrl(contract: string, tokenId?: string): string {
  return tokenId
    ? `${MONAD_EXPLORER_URL}/token/${contract}?a=${tokenId}`
    : `${MONAD_EXPLORER_URL}/token/${contract}`;
}
