import { getServiceClient } from "@/lib/supabase/server";
import type { TradeOffer, TradeOfferNFT, WalletReputation } from "@/lib/types";

function mapNft(row: any): TradeOfferNFT {
  return {
    id: row.id,
    tradeOfferId: row.trade_offer_id,
    side: row.side,
    tokenStandard: row.token_standard,
    contractAddress: row.contract_address,
    tokenId: row.token_id,
    quantity: row.quantity,
    collectionName: row.collection_name,
    imageUrl: row.image_url,
    name: row.name,
    metadata: row.metadata,
  };
}

export function mapOffer(row: any): TradeOffer {
  return {
    id: row.id,
    chainId: row.chain_id,
    makerAddress: row.maker_address,
    takerAddress: row.taker_address,
    status: row.status,
    makerMonAmount: row.maker_mon_amount,
    takerMonAmount: row.taker_mon_amount,
    nonce: row.nonce,
    expiry: row.expiry,
    signature: row.signature,
    orderHash: row.order_hash,
    isPrivate: row.is_private,
    completedTxHash: row.completed_tx_hash,
    cancelledTxHash: row.cancelled_tx_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    nfts: (row.trade_offer_nfts ?? []).map(mapNft),
  };
}

const OFFER_SELECT = "*, trade_offer_nfts(*)";

export async function getOfferById(id: string): Promise<TradeOffer | null> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("trade_offers")
    .select(OFFER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOffer(data) : null;
}

export async function listOffers(filters: {
  status?: string;
  maker?: string;
  taker?: string;
  wallet?: string;
  limit: number;
  offset: number;
}): Promise<TradeOffer[]> {
  const db = getServiceClient();
  let query = db
    .from("trade_offers")
    .select(OFFER_SELECT)
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.maker) query = query.eq("maker_address", filters.maker.toLowerCase());
  if (filters.taker) query = query.eq("taker_address", filters.taker.toLowerCase());

  if (filters.wallet) {
    const w = filters.wallet.toLowerCase();
    query = query.or(`maker_address.eq.${w},taker_address.eq.${w}`);
  } else {
    // Hide private offers from the public feed; they are only visible to
    // the maker/taker via the wallet filter or direct link.
    query = query.eq("is_private", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapOffer);
}

export async function recordEvent(
  tradeOfferId: string,
  eventType: string,
  walletAddress: string | null,
  txHash: string | null,
  data: Record<string, unknown> = {}
): Promise<void> {
  const db = getServiceClient();
  const { error } = await db.from("trade_events").insert({
    trade_offer_id: tradeOfferId,
    event_type: eventType,
    wallet_address: walletAddress?.toLowerCase() ?? null,
    tx_hash: txHash,
    data,
  });
  if (error) throw error;
}

export async function bumpReputation(
  walletAddress: string,
  field: "completed_trades_count" | "cancelled_trades_count"
): Promise<void> {
  const db = getServiceClient();
  const { error } = await db.rpc("bump_wallet_reputation", {
    p_wallet: walletAddress.toLowerCase(),
    p_field: field,
  });
  if (error) throw error;
}

export async function getReputation(
  walletAddress: string
): Promise<WalletReputation> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("wallet_reputation")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return {
    walletAddress: walletAddress.toLowerCase(),
    completedTradesCount: data?.completed_trades_count ?? 0,
    cancelledTradesCount: data?.cancelled_trades_count ?? 0,
    lastTradeAt: data?.last_trade_at ?? null,
  };
}
