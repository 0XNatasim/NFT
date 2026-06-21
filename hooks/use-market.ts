"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.wallet) query.set("wallet", params.wallet);
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

/**
 * Paginated variant: walks every page via the provider's pageKey so the
 * account page can show the wallet's full NFT collection (OpenSea-style)
 * rather than just the first page the indexer returns.
 */
export function useWalletNFTsInfinite(owner?: string) {
  return useInfiniteQuery({
    queryKey: ["wallet-nfts-infinite", owner],
    enabled: !!owner,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ owner: owner! });
      if (pageParam) params.set("pageKey", pageParam);
      return fetchJson<WalletNFTsResult>(`/api/nfts?${params}`);
    },
    getNextPageParam: (lastPage) => lastPage.pageKey ?? undefined,
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
