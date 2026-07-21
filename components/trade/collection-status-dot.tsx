import { cn } from "@/lib/utils";
import type { CollectionTradeStatus } from "@/lib/featured-collections";

const CONFIG: Record<
  CollectionTradeStatus,
  { color: string; label: string }
> = {
  open: {
    color: "bg-emerald-500",
    label: "Tradeable on Handshake — both the transfer-validator approval and the Handshake allowlist are in place.",
  },
  pending: {
    color: "bg-amber-400",
    label:
      "Almost ready — one of the two approvals (transfer-validator or Handshake allowlist) is still missing.",
  },
  locked: {
    color: "bg-red-500",
    label:
      "Trading locked — neither the transfer-validator approval nor the Handshake allowlist is in place yet.",
  },
};

/**
 * Status indicator shown on a collection's logo.
 *  - green  → tradeable (both approvals in place)
 *  - yellow → one approval missing
 *  - red    → neither approval in place
 */
export function CollectionStatusDot({
  status,
  className,
}: {
  status: CollectionTradeStatus;
  className?: string;
}) {
  const { color, label } = CONFIG[status];
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-background",
        color,
        className,
      )}
    />
  );
}
