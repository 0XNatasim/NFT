import type { NFTProvider, WalletNFTsResult } from "@/lib/nft/provider";
import { alchemyProvider } from "@/lib/nft/providers/alchemy";
import { openseaProvider } from "@/lib/nft/providers/opensea";

const providers: Record<string, NFTProvider> = {
  alchemy: alchemyProvider,
  opensea: openseaProvider,
};

export function getNFTProvider(): NFTProvider {
  const name = (process.env.NFT_PROVIDER ?? "alchemy").toLowerCase();
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unknown NFT_PROVIDER "${name}". Supported: ${Object.keys(providers).join(", ")}`
    );
  }
  return provider;
}

export async function getWalletNFTsWithFallback(
  owner: string,
  options?: { pageKey?: string | null; pageSize?: number },
): Promise<WalletNFTsResult> {
  const primaryName = (process.env.NFT_PROVIDER ?? "alchemy").toLowerCase();
  const providerOrder = [
    primaryName,
    ...Object.keys(providers).filter((name) => name !== primaryName),
  ];
  const errors: unknown[] = [];

  for (const name of providerOrder) {
    const provider = providers[name];
    if (!provider) continue;

    try {
      const result = await provider.getWalletNFTs(owner, options);
      if (result.nfts.length > 0 || result.pageKey) return result;
      errors.push(new Error(`${provider.name} returned no NFTs`));
    } catch (err) {
      errors.push(err);
    }
  }

  if (errors.length > 0) {
    console.warn("All NFT providers returned empty results or failed", errors);
  }
  return { nfts: [], pageKey: null };
}
