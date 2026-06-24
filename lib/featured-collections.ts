/**
 * Curated collections surfaced as quick-select buttons in the trade
 * builder. Useful while indexer coverage on Monad is incomplete.
 */
export interface FeaturedCollection {
  name: string;
  address: `0x${string}`;
  /** Path under /public, e.g. /collections/r3tards.png. Optional. */
  logo?: string;
}

export const FEATURED_COLLECTIONS: FeaturedCollection[] = [
  {
    name: "10kSquad",
    address: "0x818030837e8350ba63e64d7dc01a547fa73c8279",
    logo: "/collections/10ksquad.png",
  },
  {
    name: "Erebus",
    address: "0x2a0001f3d4c98881376f8d36b3c61f163d84a095",
    logo: "/collections/Erebus.png",
  },
  {
    name: "r3tards",
    address: "0x200723a706de0013316e5cd8eba2b3f53dd90c29",
    logo: "/collections/r3tards.png",
  },
  {
    name: "Molandaks",
    address: "0x36982448e77658b8f58f4665696e3173d1e696c2",
    logo: "/collections/molandaks.png",
  },
  {
    name: "Roarrr",
    address: "0xcbdfad1bfb6a4414dd4d84b7a6420dc43683deb0",
    logo: "/collections/Roarrr.png",
  },
  {
    name: "Sealuminati",
    address: "0xaeaa920165fd7ce58a0e0772ffc97f06626572cd",
    logo: "/collections/Sealuminati.png",
  },
  {
    name: "The Daks",
    address: "0x9f8514cebee138b61806d4651f51d26c8098b463",
    logo: "/collections/The Daks.png",
  },
  {
    name: "Overnads",
    address: "0xfb5ba4061f5c50b1daa6c067bb2dfb0a8ebf6a8d",
    logo: "/collections/Overnads.png",
  },
  {
    name: "Chewy",
    address: "0xe1ddf619bb352e6eb25367be99606be02836cbbc",
    logo: "/collections/Chewy.png",
  },
  {
    name: "skrumpeys",
    address: "0xb0dad798c80e40dd6b8e8545074c6a5b7b97d2c0",
  },
];