/**
 * Curated collections surfaced as quick-select buttons in the trade
 * builder. Useful while indexer coverage on Monad is incomplete.
 */
export interface FeaturedCollection {
  name: string;
  address: `0x${string}`;
  /** Legacy field kept for back-compat; prefer officialLogo when present. */
  image: string;
  /**
   * Curated, project-controlled official logo (local file or trusted URL).
   * Highest-priority source for the collection logo. Must be a STATIC image.
   */
  officialLogo?: string;
  officialWebsite?: string;
  openSeaSlug?: string;
}

export const FEATURED_COLLECTIONS: FeaturedCollection[] = [
  {
    name: "10kSquad",
    address: "0x818030837e8350ba63e64d7dc01a547fa73c8279",
    image: "/collections/10Ksquad.png",
    officialLogo: "/collections/10Ksquad.png",
    officialWebsite: "https://www.the10ksquad.xyz/",
  },
  {
    name: "Erebus",
    address: "0x2a0001f3d4c98881376f8d36b3c61f163d84a095",
    image: "/collections/Erebus.png",
    // Erebus tokens are animated .mp4s (image === animation_url on-chain), so
    // a static, project-controlled logo is pinned here and never derived from
    // token artwork.
    officialLogo: "/collections/Erebus.png",
  },
  {
    name: "r3tards",
    address: "0x200723a706de0013316e5cd8eba2b3f53dd90c29",
    image: "/collections/r3tards.png",
  },
  {
    name: "Molandaks",
    address: "0x36982448e77658b8f58f4665696e3173d1e696c2",
    image: "/collections/molandaks.png",
  },
  {
    name: "Roarrr",
    address: "0xcbdfad1bfb6a4414dd4d84b7a6420dc43683deb0",
    image: "/collections/Roarrr.png",
  },
  {
    name: "Sealuminati",
    address: "0xaeaa920165fd7ce58a0e0772ffc97f06626572cd",
    image: "/collections/Sealuminati.png",
  },
  {
    name: "The Daks",
    address: "0x9f8514cebee138b61806d4651f51d26c8098b463",
    image: "/collections/The Daks.png",
  },
  {
    name: "Overnads",
    address: "0xfb5ba4061f5c50b1daa6c067bb2dfb0a8ebf6a8d",
    image: "/collections/Overnads.png",
  },
  {
    name: "Chewy",
    address: "0xe1ddf619bb352e6eb25367be99606be02836cbbc",
    image: "/collections/Chewy.png",
  },
  {
    name: "skrumpeys",
    address: "0xb0dad798c80e40dd6b8e8545074c6a5b7b97d2c0",
    image: "/collections/skrumpeys.png",
  },
];

const byAddress = new Map(
  FEATURED_COLLECTIONS.map((collection) => [
    collection.address.toLowerCase(),
    collection,
  ]),
);

/** Case-insensitive lookup of a curated featured collection by address. */
export function getFeaturedCollection(
  address?: string | null,
): FeaturedCollection | null {
  if (!address) return null;
  return byAddress.get(address.toLowerCase()) ?? null;
}
