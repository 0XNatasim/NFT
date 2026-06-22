"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketStats, TradeOffer, WalletReputation } from "@/lib/types";
import type { WalletNFTsResult } from "@/lib/nft/provider";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function useOffers(params: {
  status?: string;
  wallet?: string;
  collection?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.wallet) query.set("wallet", params.wallet);
  if (params.collection) query.set("collection", params.collection);
  if (params.limit) query.set("limit", String(params.limit));
  return useQuery({
    queryKey: ["offers", params],
    queryFn: () =>
      fetchJson<{ offers: TradeOffer[] }>(`/api/offers?${query}`).then(
        (d) => d.offers
      ),
  });
}

export function useOffer(id: string | null) {
  return useQuery({
    queryKey: ["offer", id],
    enabled: !!id,
    queryFn: () =>
      fetchJson<{ offer: TradeOffer }>(`/api/offers/${id}`).then((d) => d.offer),
  });
}

export function useWalletNFTs(owner?: string) {
  return useQuery({
    queryKey: ["wallet-nfts", owner],
    enabled: !!owner,
    queryFn: () => fetchJson<WalletNFTsResult>(`/api/nfts?owner=${owner}`),
  });
}

export function useMarketStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJson<MarketStats>("/api/stats"),
  });
}

export function useReputation(wallet?: string) {
  return useQuery({
    queryKey: ["reputation", wallet],
    enabled: !!wallet,
    queryFn: () =>
      fetchJson<{ reputation: WalletReputation }>(
        `/api/reputation?wallet=${wallet}`
      ).then((d) => d.reputation),
  });
}
