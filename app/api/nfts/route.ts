import { NextResponse } from "next/server";
import { z } from "zod";
import { getNFTProvider } from "@/lib/nft";
import { openseaProvider } from "@/lib/nft/providers/opensea";
import { addressSchema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { publicClient } from "@/lib/chains/client";
import { erc721Abi } from "@/lib/contracts/settlement";
import { getOnChainTokenMeta } from "@/lib/nft/onchain-metadata";

export const dynamic = "force-dynamic";

// Indexers sometimes return spam/phantom entries that don't exist on the
// configured chain. Cache contract-code existence so each collection is
// checked at most once per server instance.
const contractExistsCache = new Map<string, boolean>();

// On-chain ERC721 name() per contract, so collections the indexer didn't
// name (e.g. Algebra LP positions -> "Algebra-DUST/WMON") show a real label
// instead of their address. null = no name / not a readable name().
const contractNameCache = new Map<string, string | null>();
const rarityRankCache = new Map<string, number | null>();

async function getOpenSeaRarityRank(
  contractAddress: string,
  tokenId: string,
): Promise<number | null> {
  const key = `${contractAddress.toLowerCase()}:${tokenId}`;
  const cached = rarityRankCache.get(key);
  if (cached !== undefined) return cached;

  try {
    const token = await openseaProvider.getToken(contractAddress, tokenId);
    const rank = token?.rarityRank ?? null;
    rarityRankCache.set(key, rank);
    return rank;
  } catch {
    rarityRankCache.set(key, null);
    return null;
  }
}

async function getContractName(address: string): Promise<string | null> {
  const key = address.toLowerCase();
  const cached = contractNameCache.get(key);
  if (cached !== undefined) return cached;
  try {
    const name = await publicClient.readContract({
      address: key as `0x${string}`,
      abi: erc721Abi,
      functionName: "name",
    });
    const value = typeof name === "string" && name.trim() ? name.trim() : null;
    contractNameCache.set(key, value);
    return value;
  } catch {
    contractNameCache.set(key, null);
    return null;
  }
}

async function contractExists(address: string): Promise<boolean> {
  const key = address.toLowerCase();
  const cached = contractExistsCache.get(key);
  if (cached !== undefined) return cached;
  try {
    const code = await publicClient.getCode({ address: key as `0x${string}` });
    const exists = !!code && code !== "0x";
    contractExistsCache.set(key, exists);
    return exists;
  } catch {
    // RPC hiccup: don't cache, let the NFT through rather than hide it.
    return true;
  }
}

const querySchema = z.object({
  owner: addressSchema,
  pageKey: z.string().max(2048).optional(),
});

export async function GET(req: Request) {
  const { allowed } = await rateLimit(clientKey(req, "nfts"), 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    owner: searchParams.get("owner"),
    pageKey: searchParams.get("pageKey") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const provider = getNFTProvider();
    const result = await provider.getWalletNFTs(parsed.data.owner, {
      pageKey: parsed.data.pageKey ?? null,
    });

    // Drop NFTs whose contract has no code on the configured chain.
    const contracts = Array.from(
      new Set(result.nfts.map((n) => n.contractAddress.toLowerCase()))
    );
    const existence = await Promise.all(contracts.map(contractExists));
    const valid = new Set(contracts.filter((_, i) => existence[i]));
    result.nfts = result.nfts.filter((n) =>
      valid.has(n.contractAddress.toLowerCase())
    );

    // Backfill collection names the indexer left blank from the contract's
    // on-chain name(), one lookup per unique contract.
    const unnamed = Array.from(
      new Set(
        result.nfts
          .filter((n) => !n.collectionName)
          .map((n) => n.contractAddress.toLowerCase())
      )
    );
    if (unnamed.length > 0) {
      const names = await Promise.all(unnamed.map(getContractName));
      const nameByContract = new Map(unnamed.map((c, i) => [c, names[i]]));
      for (const nft of result.nfts) {
        if (!nft.collectionName) {
          nft.collectionName =
            nameByContract.get(nft.contractAddress.toLowerCase()) ?? null;
        }
      }
    }

    // Indexers sometimes return tokens without artwork or omit raw metadata
    // for animated tokens (e.g. MP4s stored in image/animation_url). Backfill
    // the current indexer page from on-chain tokenURI metadata; the per-token
    // cache makes subsequent pages/loads cheap while keeping each request
    // bounded to the provider page size.
    const missing = result.nfts
      .filter((n) => !n.imageUrl || !n.metadata?.["animation_url"])
      .slice(0, 50);
    await Promise.all(
      missing.map(async (nft) => {
        try {
          const meta = await getOnChainTokenMeta(nft.contractAddress, nft.tokenId);
          nft.imageUrl = meta.animationUrl ?? meta.image ?? nft.imageUrl;
          nft.name = nft.name ?? meta.name;
          nft.collectionName = nft.collectionName ?? meta.collectionName;
          nft.metadata = meta.metadata ?? nft.metadata ?? null;
        } catch {
          // cosmetic only
        }
      })
    );

    // Some wallet/list endpoints do not include OpenSea rarity even though the
    // token detail endpoint does. Hydrate the current provider page directly
    // from OpenSea so rarity badges appear automatically for supported
    // collections, while keeping unsupported/no-rarity tokens unchanged.
    const missingRarity = result.nfts
      .filter((n) => n.rarityRank == null)
      .slice(0, 50);
    await Promise.all(
      missingRarity.map(async (nft) => {
        nft.rarityRank = await getOpenSeaRarityRank(
          nft.contractAddress,
          nft.tokenId,
        );
      }),
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/nfts failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch NFTs" },
      { status: 502 }
    );
  }
}
