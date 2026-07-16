import { defineChain } from "viem";

/**
 * Monad chain configuration. Everything is environment-driven so the same
 * build targets Monad Testnet today and Monad Mainnet at launch.
 */

const MONAD_MAINNET_ID = 143;
const MONAD_TESTNET_ID = 10143;

export const MONAD_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? MONAD_MAINNET_ID
);

export const MONAD_RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? "https://rpc.monad.xyz";

export const MONAD_EXPLORER_URL =
  process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ?? "https://monadscan.com";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function envAddress(value: string | undefined): `0x${string}` {
  const cleaned = (value ?? ZERO_ADDRESS)
    .trim()
    .replace(/^['\"]|['\"]$/g, "")
    .toLowerCase();

  return /^0x[0-9a-f]{40}$/.test(cleaned)
    ? (cleaned as `0x${string}`)
    : ZERO_ADDRESS;
}

export const MON = {
  name: "Monad",
  symbol: "MON",
  decimals: 18,
} as const;

export const monad = defineChain({
  id: MONAD_CHAIN_ID,
  name: MONAD_CHAIN_ID === MONAD_TESTNET_ID ? "Monad Testnet" : "Monad",
  nativeCurrency: MON,
  rpcUrls: {
    default: { http: [MONAD_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "MonadScan", url: MONAD_EXPLORER_URL },
  },
  testnet: MONAD_CHAIN_ID === MONAD_TESTNET_ID,
});

export const SETTLEMENT_CONTRACT_ADDRESS = envAddress(
  process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS,
);

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
