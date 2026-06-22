export type OfferStatus = "open" | "completed" | "cancelled" | "expired";
export type OfferSide = "maker" | "taker";

export interface NFTAsset {
  contractAddress: string;
  tokenId: string;
  tokenStandard: "ERC721";
  name: string | null;
  collectionName: string | null;
  imageUrl: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface TradeOfferNFT extends NFTAsset {
  id: string;
  tradeOfferId: string;
  side: OfferSide;
  quantity: number;
}

export interface TradeOffer {
  id: string;
  chainId: number;
  makerAddress: string;
  takerAddress: string | null;
  status: OfferStatus;
  makerMonAmount: string; // wei, as string
  takerMonAmount: string; // wei, as string
  feeBps: number; // protocol fee (bps) baked into the signed order
  flatFee: string; // flat swap fee (wei, as string) baked into the order
  nonce: string;
  expiry: number; // unix seconds
  signature: string;
  orderHash: string;
  isPrivate: boolean;
  completedTxHash: string | null;
  cancelledTxHash: string | null;
  createdAt: string;
  updatedAt: string;
  nfts: TradeOfferNFT[];
}

export interface WalletReputation {
  walletAddress: string;
  completedTradesCount: number;
  cancelledTradesCount: number;
  lastTradeAt: string | null;
}

export interface MarketStats {
  totalTrades: number;
  openOffers: number;
  totalVolumeWei: string;
}
