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
    name: "r3tards",
    address: "0x200723a706de0013316e5cd8eba2b3f53dd90c29",
    logo: "/collections/r3tards.png",
  },
  {
    name: "Molandaks",
    address: "0x36982448e77658b8f58f4665696e3173d1e696c2",
    logo: "/collections/molandaks.png",
  },
];
