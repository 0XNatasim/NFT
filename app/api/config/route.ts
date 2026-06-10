import { NextResponse } from "next/server";
import {
  MONAD_CHAIN_ID,
  MONAD_EXPLORER_URL,
  SETTLEMENT_CONTRACT_ADDRESS,
} from "@/lib/chains/monad";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Monad Market",
    chainId: MONAD_CHAIN_ID,
    explorerUrl: MONAD_EXPLORER_URL,
    settlementContract: SETTLEMENT_CONTRACT_ADDRESS,
    feeBps: 100,
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  });
}
