import { Badge } from "@/components/ui/badge";
import type { DealRoomStatus } from "@/lib/types";

const STATUS_META: Record<
  DealRoomStatus,
  { label: string; variant: "default" | "secondary" | "success" | "destructive" | "warning" | "outline" }
> = {
  open: { label: "Negotiating", variant: "default" },
  agreed: { label: "Terms agreed", variant: "warning" },
  signed: { label: "Signed — ready to settle", variant: "warning" },
  settled: { label: "Settled 🤝", variant: "success" },
  declined: { label: "Declined", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  expired: { label: "Expired", variant: "secondary" },
  superseded: { label: "Superseded", variant: "secondary" },
};

export function RoomStatusBadge({ status }: { status: DealRoomStatus }) {
  const meta = STATUS_META[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
