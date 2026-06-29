import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatEther } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function rarityRankBadgeClass(rank: number): string {
  if (rank <= 100) {
    return "border-orange-300/60 bg-orange-500/25 text-orange-100 shadow-orange-500/20";
  }
  if (rank <= 500) {
    return "border-purple-300/60 bg-purple-500/25 text-purple-100 shadow-purple-500/20";
  }
  if (rank <= 1000) {
    return "border-blue-300/60 bg-blue-500/25 text-blue-100 shadow-blue-500/20";
  }
  return "border-white/20 bg-white/15 text-white/90 shadow-black/20";
}

export function shortAddress(address?: string | null): string {
  if (!address) return "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Turn an indexer collection slug into a human label. OpenSea returns slugs
 * like "roarrr-640074190" or "the-10k-squad-350905"; strip the trailing
 * numeric id and title-case the words. Real names (no slug shape) pass through
 * mostly unchanged.
 */
export function prettyCollectionName(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  // Only treat it as a slug when it's all-lowercase, hyphen/underscore
  // separated (OpenSea's slug shape). Genuine display names like
  // "Algebra-DUST/WMON" keep their original casing/punctuation.
  if (!/^[a-z0-9]+([-_][a-z0-9]+)+$/.test(trimmed)) return trimmed;
  const withoutId = trimmed.replace(/[-_]\d+$/, "");
  return withoutId
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatMon(wei: bigint | string, maxDecimals = 4): string {
  const value = typeof wei === "string" ? BigInt(wei) : wei;
  const formatted = formatEther(value);
  const [whole, frac = ""] = formatted.split(".");
  const trimmed = frac.slice(0, maxDecimals).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function timeUntil(unixSeconds: number): string {
  const diff = unixSeconds * 1000 - Date.now();
  if (diff <= 0) return "expired";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
