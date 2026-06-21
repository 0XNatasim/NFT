import type { CollectionPrice, NFTProvider } from "@/lib/nft/provider";
import { reservoirProvider } from "@/lib/nft/providers/reservoir";
import { openseaProvider } from "@/lib/nft/providers/opensea";
import { getNFTProvider } from "@/lib/nft";

/**
 * Pricing is decoupled from the wallet indexer: the source that lists a
 * wallet's NFTs (NFT_PROVIDER) need not be the one that prices collections.
 * Pick the price source with PRICE_PROVIDER; if unset we fall back to whatever
 * can actually price — the wallet provider, then any provider whose API key is
 * configured.
 */

export interface PriceProvider {
  readonly name: string;
  getCollectionPrice(contractAddress: string): Promise<CollectionPrice | null>;
}

// Providers that implement getCollectionPrice, keyed by name.
const pricingCapable: Record<string, NFTProvider> = {
  reservoir: reservoirProvider,
  opensea: openseaProvider,
};

function hasApiKey(name: string): boolean {
  switch (name) {
    case "reservoir":
      return !!process.env.RESERVOIR_API_KEY;
    case "opensea":
      return !!process.env.OPENSEA_API_KEY;
    default:
      return false;
  }
}

function asPriceProvider(provider: NFTProvider): PriceProvider | null {
  if (!provider.getCollectionPrice) return null;
  const fn = provider.getCollectionPrice.bind(provider);
  return { name: provider.name, getCollectionPrice: fn };
}

let cached: PriceProvider | null | undefined;

export function getPriceProvider(): PriceProvider | null {
  if (cached !== undefined) return cached;
  cached = resolvePriceProvider();
  return cached;
}

function resolvePriceProvider(): PriceProvider | null {
  // 1. Explicit choice via PRICE_PROVIDER.
  const explicit = process.env.PRICE_PROVIDER?.toLowerCase();
  if (explicit) {
    const provider = pricingCapable[explicit];
    if (provider) {
      const p = asPriceProvider(provider);
      if (p) return p;
    }
    // Unknown/unsupported value: fall through to auto-detection rather than
    // silently pricing nothing.
  }

  // 2. Reuse the wallet provider if it can price (no extra config needed).
  try {
    const wallet = asPriceProvider(getNFTProvider());
    if (wallet) return wallet;
  } catch {
    // wallet provider misconfigured — keep looking
  }

  // 3. Any pricing-capable provider that has its API key set.
  for (const [name, provider] of Object.entries(pricingCapable)) {
    if (hasApiKey(name)) {
      const p = asPriceProvider(provider);
      if (p) return p;
    }
  }

  return null;
}
