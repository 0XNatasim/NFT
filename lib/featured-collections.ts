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
  /**
   * True when the collection enforces an on-chain transfer validator
   * (ERC721-C / Creator Token Standard style). Handshake's settlement
   * contract must be allowlisted by the collection owner before any trade can
   * settle, so until that happens the collection is surfaced as "locked" (red
   * dot) and cannot be traded — it stays visible so holders can still browse
   * it. Collections without a transfer validator trade freely and are shown
   * with a green dot.
   */
  transferValidator?: boolean;
}

/**
 * Trade status derived from the transfer-validator gate.
 *  - "locked": collection has a transfer validator and Handshake's settlement
 *    contract is not yet approved by the owner → red dot, not tradeable.
 *  - "open": no transfer-validator gate → green dot, tradeable.
 */
export function isCollectionTradeLocked(
  collection: Pick<FeaturedCollection, "transferValidator">,
): boolean {
  return collection.transferValidator === true;
}

export const FEATURED_COLLECTIONS: FeaturedCollection[] = [
  // ── Tradeable now (no transfer-validator gate) — green dot ──────────────
  {
    name: "Erebus",
    address: "0x2a0001f3d4c98881376f8d36b3c61f163d84a095",
    image: "/collections/Erebus.png",
    // Erebus tokens are animated .mp4s (image === animation_url on-chain), so
    // a static, project-controlled logo is pinned here and never derived from
    // token artwork.
    officialLogo: "/collections/Erebus.png",
    transferValidator: false,
  },
  {
    name: "r3tards",
    address: "0x200723a706de0013316e5cd8eba2b3f53dd90c29",
    image: "/collections/r3tards.png",
    transferValidator: false,
  },
  {
    name: "skrumpeys",
    address: "0xb0dad798c80e40dd6b8e8545074c6a5b7b97d2c0",
    image: "/collections/skrumpeys.png",
    transferValidator: false,
  },
  {
    name: "Monshape",
    address: "0x1c921c0ccc4f1f90a18a1297dc040528b3cf0f5b",
    image: "/collections/monshape.png",
    officialLogo: "/collections/monshape.png",
    transferValidator: false,
  },
  {
    name: "Monafuku Cafe",
    address: "0xb6f9ba0511edced7491b06f33201b494575017eb",
    image: "/Logomark.png",
    transferValidator: false,
  },
  {
    name: "Kapysh",
    address: "0x6602fdcf8553671a9cba9f8765ab5f4d0bc8e66e",
    image: "/Logomark.png",
    transferValidator: false,
  },
  {
    name: "Monads Mogs",
    address: "0x1414f3baf22404c42fd656af4afaab4934045137",
    image: "/Logomark.png",
    transferValidator: false,
  },
  {
    name: "Monmilios",
    address: "0x5ccd3ca6279807a9e49432d37f72841a0b7f96be",
    image: "/Logomark.png",
    transferValidator: false,
  },

  // ── Transfer-validator gated — locked until owner approves settlement ──
  //    (red dot; visible but not tradeable yet)
  {
    name: "10kSquad",
    address: "0x818030837e8350ba63e64d7dc01a547fa73c8279",
    image: "/collections/10Ksquad.png",
    officialLogo: "/collections/10Ksquad.png",
    officialWebsite: "https://www.the10ksquad.xyz/",
    transferValidator: true,
  },
  {
    name: "Molandaks",
    address: "0x36982448e77658b8f58f4665696e3173d1e696c2",
    image: "/collections/molandaks.png",
    transferValidator: true,
  },
  {
    name: "Roarrr",
    address: "0xcbdfad1bfb6a4414dd4d84b7a6420dc43683deb0",
    image: "/collections/Roarrr.png",
    transferValidator: true,
  },
  {
    name: "Sealuminati",
    address: "0xaeaa920165fd7ce58a0e0772ffc97f06626572cd",
    image: "/collections/Sealuminati.png",
    transferValidator: true,
  },
  {
    name: "The Daks",
    address: "0x9f8514cebee138b61806d4651f51d26c8098b463",
    image: "/collections/The Daks.png",
    transferValidator: true,
  },
  {
    name: "Overnads",
    address: "0xfb5ba4061f5c50b1daa6c067bb2dfb0a8ebf6a8d",
    image: "/collections/Overnads.png",
    transferValidator: true,
  },
  {
    name: "Chewy",
    address: "0xe1ddf619bb352e6eb25367be99606be02836cbbc",
    image: "/collections/Chewy.png",
    transferValidator: true,
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
