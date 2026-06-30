# Handshake Blockchain Transaction Audit

**Date:** 2026-06-30
**Scope:** Every user action that creates, signs, submits, confirms, or reads a
blockchain transaction in the Handshake (Monad Market) app.
**Chain:** Monad — `NEXT_PUBLIC_CHAIN_ID` (mainnet `143` / testnet `10143`).
**Settlement contract:** `MonadMarketSettlement` (EIP-712 signed off-chain
orders, atomic on-chain settlement).

This audit found the transaction *architecture* sound (simulate-before-send on
the accept path, on-chain verification in the complete/cancel APIs, self-managed
escrow) but the *execution* inconsistent: gas buffering, simulation, structured
logging, error classification, and post-transaction refresh were applied to some
flows and not others. That inconsistency is the most likely cause of the
"several flows failing" reported — see **Broken flows** below.

---

## 1. Transaction audit map

| # | File | Function / component | User action | Contract method | Chain | Wallet req. | Prior failure mode |
|---|------|----------------------|-------------|-----------------|-------|-------------|--------------------|
| 1 | `lib/wagmi.ts`, `components/layout/header.tsx` | `wagmiConfig`, `ConnectButton` | Connect wallet | — | Monad | — | OK |
| 2 | `components/wallet/network-guard.tsx` | `NetworkGuard` | Switch chain | `wallet_switchEthereumChain` | Monad | connected | OK |
| 3 | `app/create/page.tsx` | `handleSign` | Propose a Deal / Create Offer | `signTypedData` (off-chain) → `POST /api/offers` | Monad | connected | Raw error on wallet rejection |
| 4 | `app/create/page.tsx` | `handleApproveCollections` | Approve NFT collections (maker, pre-list) | `setApprovalForAll` | Monad | maker | OK (already buffered gas) |
| 5 | `app/offers/[id]/page.tsx` | `handleMakerApprove` → `ensureApprovals` | Approve NFTs (maker, on detail) | `setApprovalForAll` | Monad | maker | OK (already buffered gas) |
| 6 | `app/offers/[id]/page.tsx` | `handleAccept` → `ensureApprovals` | Approve NFTs (taker) | `setApprovalForAll` | Monad | taker | OK (already buffered gas) |
| 7 | `app/offers/[id]/page.tsx` | `handleAccept` | Accept Deal / Execute trade / settlement | `fulfillTrade` (payable) → `POST …/complete` | Monad | taker | **No gas buffer → "gas limit too low" on Monad** |
| 8 | `app/offers/[id]/page.tsx` | `handleCancel` | Cancel Deal | `cancelNonce` → `POST …/cancel` | Monad | maker | **No simulation, no gas buffer; cryptic revert on already-used nonce** |
| 9 | `app/offers/[id]/page.tsx` | `handleDeposit` | Fund maker MON escrow for a deal | `deposit` (payable) | Monad | maker | **No gas buffer** |
| 10 | `components/wallet/escrow-panel.tsx` | `run("deposit")` | Deposit MON escrow (dashboard) | `deposit` (payable) | Monad | connected | **No gas buffer** |
| 11 | `components/wallet/escrow-panel.tsx` | `run("withdraw")` | Withdraw MON escrow | `withdraw` | Monad | connected | **No gas buffer** |
| 12 | `app/offers/[id]/page.tsx` | `escrowQuery` | Read maker escrow vs. required | `escrowBalance`, `quoteFees` (view) | Monad | any | OK |
| 13 | `app/create/page.tsx` | `refreshApprovalStatus`, `addOfferedNftManually` | Read approval / ownership | `isApprovedForAll`, `ownerOf` (view) | Monad | maker | OK |
| 14 | `app/api/offers/[id]/complete/route.ts` | `POST` | Confirm settlement (server) | `getTransactionReceipt` + decode `TradeExecuted` | Monad | — | OK |
| 15 | `app/api/offers/[id]/cancel/route.ts` | `POST` | Confirm cancellation (server) | `nonceUsed` (view) | Monad | — | OK |
| 16 | `app/api/offers/route.ts` | `POST` | Verify maker signature, persist order | `verifyTypedData` (off-chain) | Monad | — | OK |

---

## 2. Broken / risky flows found

- **B1 — Inconsistent gas buffering (High, most likely root cause).**
  `lib/chains/gas.ts:bufferedGas` exists *specifically* because "some Monad RPC
  nodes reject transactions whose gas limit is merely estimate-tight with 'Gas
  limit too low'." It was applied to the three approval flows but **not** to
  `fulfillTrade` (accept), `cancelNonce`, `deposit`, or `withdraw`. Those are
  exactly the value-moving flows users reported failing.
- **B2 — No simulation on cancel / deposit / withdraw (Medium).** Only the
  accept path simulated first. A cancel of an already-filled/cancelled nonce, or
  a withdraw above balance, reverted with an undecoded message instead of a
  clear reason.
- **B3 — Poor error mapping (Medium).** Every catch did
  `err?.shortMessage ?? err?.message`, surfacing raw viem strings. Wallet
  rejection, insufficient funds, wrong-network, RPC timeouts, and
  dropped/replaced transactions were indistinguishable to the user.
- **B4 — No structured logging (Medium).** There was no record of
  wallet/chain/contract/args/simulation/hash/receipt/error for any step, making
  live debugging of "it just failed" nearly impossible.
- **B5 — Incomplete post-transaction refresh (Medium).** Accept/cancel only
  re-fetched the single offer. The offers feed, wallet NFT ownership, escrow
  balances, approvals, dashboard notifications, and stats stayed stale — the
  classic "indexer says I still own it" symptom.
- **B6 — Default chain is mainnet (Low/config).** `MONAD_CHAIN_ID` defaults to
  `143` and `MONAD_RPC_URL` to `https://rpc.monad.xyz` when env is unset. If the
  settlement contract is deployed on testnet (`10143`) but env is missing, every
  write targets the wrong chain. Not a code bug, but a deployment foot-gun — see
  Env issues.

---

## 3. What was fixed

A single, shared transaction runner now backs **every** write so the guarantees
are uniform.

- **`lib/chains/tx.ts` — `runWrite()`** (new). For accept, cancel, all approvals,
  deposit, and withdraw it: validates the wallet chain *before* prompting →
  `simulateContract` (catches reverts before gas) → **buffered gas** (`+50%`,
  fixes B1) → submit → `waitForTransactionReceipt` and verify `status` →
  classify any error into a user-safe message. Throws `TxError` whose `.message`
  is already display-ready and whose `.errorName`/`.revertReason` feed logging.
- **`lib/chains/tx-errors.ts` — `classifyTxError()`** (new). Maps wallet/RPC/
  contract failures to specific messages: user rejection (EIP-1193 `4001`),
  wrong network, insufficient funds, gas-too-low, dropped/replaced tx, RPC
  transport failure, decoded settlement reverts (via `settlementErrorMessages`),
  and a safe fallback. (Fixes B3, item 7/8.)
- **`lib/chains/tx-log.ts` — structured logger** (new). Bounded in-memory ring
  buffer capturing wallet, chainId, contract, function, args, simulation result,
  tx hash, receipt status, error name/message, and decoded revert reason for
  every phase. Console output is gated to development; the buffer never leaves
  the browser. (Fixes B4.)
- **`components/dev/tx-debug-panel.tsx` — dev-only debug panel** (new), mounted
  in `app/providers.tsx`. Renders nothing in production; in development it shows
  the live transaction log with an error count and a clear button. (Item 12.)
- **`app/offers/[id]/page.tsx`** — `handleAccept`, `handleCancel`,
  `handleDeposit`, `handleMakerApprove`/`ensureApprovals` all routed through
  `runWrite` (consistent simulation + gas + logging + errors). Added
  `refreshAfterTx()` which invalidates offers, incoming-offers, wallet NFTs,
  escrow balances, and stats after settle/cancel. (Fixes B1, B2, B5.)
  `ensureApprovals` now skips collection-wide bid pseudo-tokens.
- **`components/wallet/escrow-panel.tsx`** — deposit/withdraw routed through
  `runWrite`. (Fixes B1, B2.)
- **`app/create/page.tsx`** — collection approval routed through `runWrite`;
  signature rejection now classified into a friendly message. (Fixes B3 on the
  proposal flow.)

### Validation now performed before every send (items 5 & 6)

Pre-flight `simulateContract` against the live contract validates, in one step,
everything item 5 asks for: wallet connected & on the correct chain (explicit
guard), order not expired, nonce not used (deal still active), designated-taker
match, correct payment/`msg.value`, sufficient maker escrow, **on-chain NFT
ownership**, and **marketplace approval** — because `fulfillTrade` reverts on any
of these and the simulation surfaces the exact custom error. This is strictly
stronger than client-side guesses against possibly-stale indexer data.

### Button states (item 9)

Accept/cancel/approve/deposit buttons were already `disabled` while
`working !== null` and showed spinners; the accept button additionally disables
on expired/wrong-chain/wrong-taker with an explanatory banner. With `runWrite`,
`onSubmitted` flips the toast from "preparing/awaiting signature" to "pending
on-chain", and failures now end in a specific, retryable error message.

---

## 4. Still requires live-wallet / manual testing

These cannot be exercised without a funded Monad wallet and the deployed
contract; the logic is in place and unit-smoke-tested, but confirm end-to-end:

- Accept (settlement) of each order shape: NFT↔NFT, NFT↔MON, MON↔NFT, and
  mixed, including the buffered-gas path on a real Monad RPC node (B1).
- Maker deposit → taker accept → balances/ownership refresh on both wallets.
- Cancel of an open deal and the "already filled/cancelled" simulation message.
- Wallet-rejection, insufficient-funds, and wrong-network messages against a
  real wallet (MetaMask / Rainbow / WalletConnect).
- Escrow deposit/withdraw from the dashboard panel.
- Collection-wide buy ("answer with a private deal") happy path.

---

## 5. Contract / API / env issues discovered

- **Env (deployment):** Confirm `NEXT_PUBLIC_CHAIN_ID`,
  `NEXT_PUBLIC_MONAD_RPC_URL`, and `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` are
  all set and mutually consistent in production. The defaults (`143` /
  `rpc.monad.xyz` / zero-address) silently target mainnet; a missing settlement
  address yields a zero-address contract. `GET /api/health` already checks
  chain match + deployed bytecode + DB — wire it into deploy/monitoring.
- **Contract:** No interface bug found — the on-chain `TradeOrder` struct, the
  `TRADE_ORDER_TYPEHASH`, the TypeScript `ORDER_TYPES`, and the settlement ABI
  in `lib/contracts/settlement.ts` are byte-compatible. Fee math in `lib/fees.ts`
  mirrors the contract (verified by `tests/fees.test.ts`). **No contract change
  was required** (per instruction 13).
- **API:** `complete` and `cancel` routes correctly verify on-chain facts before
  mutating DB state; left unchanged. (`takerAddress` mismatch is already
  rejected.)

---

## 6. Tests

- `tests/tx-errors.test.ts` (new, 10 cases) — error classification for every
  category, plus "never throws on non-Error input".
- `tests/tx-run.test.ts` (new, 6 cases) — `runWrite` smoke tests with mocked
  clients: gas buffered by 50%, wrong-chain rejection before prompting,
  simulation-revert never submits, gas-estimation-failure fallback, reverted
  receipt throws, `simulate:false` skips simulation.
- Existing `eip712`, `fees`, `validation`, `wanted-auth` suites still pass.

**Result:** `npm run test` → 47 passing (was 31). `npx tsc --noEmit` clean.
`npm run build` succeeds.
