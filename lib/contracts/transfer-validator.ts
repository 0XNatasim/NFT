/**
 * Limit Break Creator Token Transfer Validator (ERC721-C).
 *
 * Every transfer-validator-gated collection in FEATURED_COLLECTIONS reports the
 * same validator via `getTransferValidator()`:
 *   0x721C008fdff27BF06E7E123956E2Fe03B63342e3
 *
 * A gated collection can only be traded through Handshake once its owner has
 * authorised Handshake's settlement contract on this validator. The validator's
 * `isTransferAllowed(collection, caller, from, to)` view answers exactly that:
 * with `caller` = the settlement contract, it returns true only when a transfer
 * the settlement contract initiates would pass the collection's policy.
 *
 * This read is FAIL-CLOSED everywhere it is consumed: a revert, a wrong ABI, or
 * any inconclusive result is treated as "not approved" (stays locked/red), so a
 * collection is never shown as tradeable on an unverified positive.
 */
export const TRANSFER_VALIDATOR_ADDRESS =
  "0x721C008fdff27BF06E7E123956E2Fe03B63342e3" as const;

/**
 * Representative, code-free EOAs used as the from/to of the probe transfer. They
 * only need to be plausible externally-owned accounts; the check we care about
 * is whether `caller` (the settlement contract) is an authorised operator.
 */
export const TRANSFER_PROBE_FROM =
  "0x1111111111111111111111111111111111111111" as const;
export const TRANSFER_PROBE_TO =
  "0x2222222222222222222222222222222222222222" as const;

export const transferValidatorAbi = [
  {
    type: "function",
    name: "isTransferAllowed",
    stateMutability: "view",
    inputs: [
      { name: "collection", type: "address" },
      { name: "caller", type: "address" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getTransferValidator",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;
