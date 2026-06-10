/**
 * Protocol fee math. Mirrors MonadMarketSettlement.sol exactly
 * (integer division, bps on each MON leg, flat fee on NFT-only swaps).
 */

export const DEFAULT_FEE_BPS = 100n; // 1%
export const BPS_DENOMINATOR = 10_000n;

export interface FeeQuote {
  makerLegFee: bigint;
  takerLegFee: bigint;
  flatFee: bigint;
  totalFee: bigint;
  /** msg.value the taker must send: takerMonAmount + takerLegFee + flatFee */
  takerPays: bigint;
  /** escrow the maker must hold: makerMonAmount + makerLegFee */
  makerEscrowRequired: bigint;
}

export function quoteFees(
  makerMonAmount: bigint,
  takerMonAmount: bigint,
  feeBps: bigint = DEFAULT_FEE_BPS,
  flatSwapFee: bigint = 0n
): FeeQuote {
  const makerLegFee = (makerMonAmount * feeBps) / BPS_DENOMINATOR;
  const takerLegFee = (takerMonAmount * feeBps) / BPS_DENOMINATOR;
  const flatFee = makerMonAmount === 0n && takerMonAmount === 0n ? flatSwapFee : 0n;
  const totalFee = makerLegFee + takerLegFee + flatFee;
  return {
    makerLegFee,
    takerLegFee,
    flatFee,
    totalFee,
    takerPays: takerMonAmount + takerLegFee + flatFee,
    makerEscrowRequired: makerMonAmount + makerLegFee,
  };
}
