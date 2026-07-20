import { cn } from "@/lib/utils";

const LOCKED_LABEL =
  "Trading locked — the collection owner must approve Handshake's settlement contract before these NFTs can be traded.";
const OPEN_LABEL = "Tradeable on Handshake.";

/**
 * Small status indicator shown on a collection's logo.
 *  - red  → transfer-validator gated, trading locked until owner approval
 *  - green → no transfer-validator gate, tradeable now
 */
export function CollectionStatusDot({
  locked,
  className,
}: {
  locked: boolean;
  className?: string;
}) {
  const label = locked ? LOCKED_LABEL : OPEN_LABEL;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-background",
        locked ? "bg-red-500" : "bg-emerald-500",
        className,
      )}
    />
  );
}
