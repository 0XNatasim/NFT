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
    logo: "/collections/erebus.png",
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
    name: "MonGang",
    address: "0xec7bf726c8011048e3c14c88fae1a788d22c220f",
    logo: "/collections/mongang.png",
  },
  {
    name: "MonShape",
    address: "0x1c921c0ccc4f1f90a18a1297dc040528b3cf0f5b",
    logo: "/collections/monshape.png",
  },
  {
    name: "Lilstarrrs",
    address: "0xcabf3c04b90f4fe1b521fcaf4acb25d5df478e52",
    logo: "/collections/lilstarrrs.png",
  },
  {
    name: "LootGo",
    address: "0xa3522ea57c0bc48e602e2fe9f3929309d9618d96",
    logo: "/collections/lootgo.png",
  },
];
