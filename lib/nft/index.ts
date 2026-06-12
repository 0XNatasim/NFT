import type { NFTProvider } from "@/lib/nft/provider";
import { alchemyProvider } from "@/lib/nft/providers/alchemy";
import { reservoirProvider } from "@/lib/nft/providers/reservoir";
import { openseaProvider } from "@/lib/nft/providers/opensea";

const providers: Record<string, NFTProvider> = {
  alchemy: alchemyProvider,
  reservoir: reservoirProvider,
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
