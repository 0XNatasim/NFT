import type { NFTProvider } from "@/lib/nft/provider";
import { alchemyProvider } from "@/lib/nft/providers/alchemy";
import { reservoirProvider } from "@/lib/nft/providers/reservoir";

const providers: Record<string, NFTProvider> = {
  alchemy: alchemyProvider,
  reservoir: reservoirProvider,
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
