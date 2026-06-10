"use client";

import { quoteFees } from "@/lib/fees";
import { formatMon } from "@/lib/utils";

export function FeeBreakdown({
  makerMonAmount,
  takerMonAmount,
  feeBps = 100n,
  flatSwapFee = 0n,
}: {
  makerMonAmount: bigint;
  takerMonAmount: bigint;
  feeBps?: bigint;
  flatSwapFee?: bigint;
}) {
  const quote = quoteFees(makerMonAmount, takerMonAmount, feeBps, flatSwapFee);
  const feePct = Number(feeBps) / 100;

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
      <p className="mb-2 font-medium">Fee breakdown</p>
      <Row label="Maker sends" value={`${formatMon(makerMonAmount)} MON`} />
      <Row label="Taker sends" value={`${formatMon(takerMonAmount)} MON`} />
      <Row
        label={`Protocol fee (${feePct}% of MON legs)`}
        value={`${formatMon(quote.makerLegFee + quote.takerLegFee)} MON`}
      />
      {quote.flatFee > 0n && (
        <Row label="Flat swap fee" value={`${formatMon(quote.flatFee)} MON`} />
      )}
      <div className="my-2 border-t border-border" />
      <Row label="Taker pays total" value={`${formatMon(quote.takerPays)} MON`} bold />
      {makerMonAmount > 0n && (
        <Row
          label="Maker escrow required"
          value={`${formatMon(quote.makerEscrowRequired)} MON`}
          bold
        />
      )}
      {quote.totalFee === 0n && (
        <p className="pt-1 text-xs text-emerald-400">
          NFT-for-NFT swap — no protocol fee.
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : undefined}>{value}</span>
    </div>
  );
}
