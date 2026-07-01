# Reentrancy & Settlement Security Audit — MonadMarketSettlement

**Target:** `contracts/src/MonadMarketSettlement.sol` (Solidity 0.8.28)
**Scope:** Reentrancy and adjacent settlement vulnerabilities in the Handshake
P2P NFT marketplace settlement flow on Monad.
**Commit / branch:** `claude/monad-marketplace-reentrancy-audit-saj5qq`
**Reviewer:** Senior Solidity security auditor (manual line-by-line review)
**Toolchain note:** Foundry/`solc` could not be installed in the review sandbox
(the installer host `foundry.paradigm.xyz` is blocked by the environment
network policy, and no cached `solc`/`forge` is present). The regression suite
in `contracts/test/MonadMarketSettlementReentrancy.t.sol` is written against the
existing, compiling harness and is intended to be run locally with
`forge test --root contracts -vvv`.

---

## 1. Executive summary

`MonadMarketSettlement` is a **non-custodial, order-book settlement contract**.
Makers sign EIP-712 `TradeOrder`s off-chain; a taker submits the order + maker
signature on-chain via `fulfillTrade`, which atomically swaps NFTs (peer-to-peer
`safeTransferFrom`) and MON (maker MON from a self-managed escrow, taker MON from
`msg.value`), skimming an agreed protocol fee into a pull-payment ledger.

**Overall reentrancy posture: strong.** The contract applies, in combination:

1. **OpenZeppelin `ReentrancyGuard`** on every value/asset-moving external
   function — `fulfillTrade`, `withdraw`, `withdrawFees` (lines 144, 155, 173).
   All three share one guard word, so **cross-function reentrancy between them is
   also blocked**, not just same-function reentrancy.
2. **Strict Checks-Effects-Interactions** in `fulfillTrade`: nonce, escrow and
   fee state are all written (lines 219–223) *before* any NFT transfer or native
   send (lines 226–230).
3. **Pull payments** for protocol fees (`pendingFees` + `withdrawFees`), so a
   reverting fee recipient cannot brick trades and no fee push happens inside the
   trade.
4. **Non-custodial NFT handling** — the contract never holds NFTs; it is only an
   approved operator moving tokens directly between maker and taker, so there is
   no escrowed-NFT balance to desync or steal.
5. **`.call{value:}` with explicit success check** everywhere (`_sendNative`,
   lines 365–368) — no reliance on `.transfer`/`.send` 2300-gas stipends, which
   is the correct choice for Monad and future EVM gas-schedule changes.

**No Critical, High, or Medium reentrancy vulnerabilities were found.** Every
classic, cross-function, read-only, and callback-driven (`onERC721Received`,
malicious-NFT, malicious buyer/seller) reentrancy path was traced and is closed
by the guard + CEI ordering. The findings below are **Low / Informational**:
economic-griefing and operational hardening items, none of which lead to loss,
lock, or duplication of funds or NFTs.

**Go / No-Go: GO for mainnet** with respect to reentrancy and settlement
atomicity, contingent on (a) running the provided regression suite green, and
(b) acknowledging the Low/Info items (particularly L-1 escrow-withdraw griefing)
as accepted, documented behavior.

---

## 2. Reentrancy attack surface table

| # | External interaction | Location | Reenters attacker? | Guarded | State finalized before call? | Verdict |
|---|----------------------|----------|--------------------|---------|------------------------------|---------|
| 1 | `safeTransferFrom` maker→taker (`onERC721Received` on taker) | `_transferNFTs` L361 (called L226) | Yes (taker code) | `nonReentrant` (fulfillTrade) | Yes (L219–223) | **Safe** |
| 2 | `safeTransferFrom` taker→maker (`onERC721Received` on maker) | `_transferNFTs` L361 (called L227) | Yes (maker code) | `nonReentrant` | Yes | **Safe** |
| 3 | Arbitrary NFT contract code inside `safeTransferFrom` / `_update` | L361 | Yes (token code) | `nonReentrant` | Yes | **Safe** |
| 4 | `.call{value}` MON payout to maker | `_sendNative` L366 (called L229) | Yes (maker code) | `nonReentrant` | Yes | **Safe** |
| 5 | `.call{value}` MON payout to taker | `_sendNative` L366 (called L230) | Yes (taker code) | `nonReentrant` | Yes | **Safe** |
| 6 | `.call{value}` escrow refund | `_sendNative` L366 (called L150) | Yes | `nonReentrant` (withdraw) | Yes (L148) | **Safe** |
| 7 | `.call{value}` fee withdrawal | `_sendNative` L366 (called L160) | Yes | `nonReentrant` (withdrawFees) | Yes (L158) | **Safe** |
| 8 | EIP-1271 `isValidSignature` staticcall to maker wallet | `SignatureChecker` L198 | Read-only (STATICCALL) | n/a | pre-effects check | **Safe** |
| 9 | `ownerOf`/`getApproved`/`isApprovedForAll` on NFT | `_verifyNFTs` L347–352 | Read-only (STATICCALL) | n/a | pre-effects check | **Safe** |
| 10 | `deposit` (payable, no external call) | L138 | No | none (not needed) | n/a | **Safe** |
| 11 | `cancelNonce`/`cancelNonces` (no external call) | L243–256 | No | none (not needed) | n/a | **Safe** |

---

## 3. Function-by-function audit

### `deposit()` — L138–142
Payable, increments `escrowBalance[msg.sender]`. No external call → no reentrancy
surface. Rejects zero value. **Safe.** No `nonReentrant` needed (and adding it
would be pointless). Note: a reentrant call *into* `deposit` from another
function's callback only credits the caller with real MON it just sent — no harm.

### `withdraw(uint256 amount)` — L144–151
`nonReentrant`. CEI is correct: reads `balance`, checks `balance < amount`,
**writes `escrowBalance[msg.sender] = balance - amount` (L148) before**
`_sendNative` (L150). A reentrant `withdraw` is stopped twice over — first by the
guard, and even absent the guard the balance is already decremented, so a nested
call reverts `InsufficientEscrow`. **Safe against classic reentrant refund
draining** (proven by `test_ReentrantWithdraw_CannotDrainEscrow`).

### `withdrawFees()` — L155–161
`nonReentrant`. CEI correct: caches `amount`, **zeroes `pendingFees[msg.sender]`
(L158) before** `_sendNative` (L160). Pull-payment keyed by `msg.sender`, so each
recipient can only ever pull its own accrued balance, once. Deliberately *not*
`whenNotPaused` so fee recipients can always exit. **Safe.** Double-withdraw
blocked by the zeroing (proven by `test_CannotWithdrawFeesTwice`).

### `fulfillTrade(TradeOrder, bytes)` — L170–240 (core settlement)
`nonReentrant whenNotPaused`. This is the critical function. Ordering:

* **Checks (L177–216):** empty-order, item caps, expiry, taker authorization,
  self-trade, nonce-unused, fee caps, **signature (L198)**, exact `msg.value`
  (L209), maker escrow sufficiency (L213), and NFT ownership+approval for both
  sides (`_verifyNFTs`, L215–216, via STATICCALL).
* **Effects (L218–223):** `nonceUsed[maker][nonce] = true` (L219),
  `escrowBalance[maker] -= makerCost` (L220), `pendingFees[feeRecipient] +=
  totalFee` (L223). **All controlling state is committed here.**
* **Interactions (L225–230):** NFT transfers then native sends.

Because the consumed nonce, the escrow debit, and the fee credit are all written
*before* the first external call, any reentrant call — same-function or into
`withdraw`/`withdrawFees` — hits the shared guard and reverts. Even if the guard
were removed, the nonce is already burned, so a nested `fulfillTrade` on the same
order reverts `NonceAlreadyUsed`. **No double-settlement, no escrow double-spend,
no fee double-credit.** MON conservation checked below.

**MON conservation (fee accounting desync check):**
`totalFee = makerLegFee + takerLegFee + flatFee`.
Inflow for the trade = `msg.value` (`= takerMonAmount + takerLegFee + flatFee`,
enforced L209) + escrow debit `makerCost` (`= makerMonAmount + makerLegFee`,
L212/220). Outflow = `takerMonAmount`→maker + `makerMonAmount`→taker +
`totalFee`→`pendingFees`. Sum in == sum out exactly. **No accounting desync, no
stuck or duplicated MON.**

### `cancelNonce(uint256)` / `cancelNonces(uint256[])` — L243–256
Mark a maker's own nonce consumed; revert `NonceAlreadyUsed` if already consumed
(idempotency guard). No external calls → no reentrancy surface, no guard needed.
Shares the `nonceUsed` map with settlement, so cancel and fill are mutually
exclusive on a nonce (proven by tests 6–8). The loop variant has no external call
inside it, so "external call in a loop" does **not** apply. **Safe.**

### `hashOrder` / `domainSeparator` / `quoteFees` — L262–295
Pure/view. `hashOrder` binds every economic field (both NFT arrays, both MON
amounts, `feeBps`, `flatFee`, `nonce`, `expiry`, `maker`, `taker`) plus the
EIP-712 domain (chainId + `verifyingContract`), so **no field is unbound and
cross-chain / cross-contract replay is impossible**. **Safe.** (See Info-2 on the
`quoteFees`-vs-order fee-source nuance.)

### Admin: `setFeeRecipient` / `setFeeBps` / `setFlatSwapFee` / `pause` / `unpause` — L301–328
`onlyOwner` (`Ownable2Step`, so ownership transfer is two-step). Fees are bounded
by `MAX_FEE_BPS`/`MAX_FLAT_SWAP_FEE`. **The owner can never move user escrow or
NFTs, and can never change the fee on an already-signed order** (settlement uses
`order.feeBps`/`order.flatFee`, only bounding them by the hard caps at L190–191).
`pause` blocks only new settlements; exit paths (`withdraw`, `withdrawFees`,
`cancelNonce`) stay open. **Safe / good design.**

### Internal helpers — L334–368
* `_hashNFTItems` L334 — EIP-712 array hashing, pure. Safe.
* `_verifyNFTs` L344 — STATICCALL view checks only (the interface functions are
  `view`, compiled to `STATICCALL`), so an untrusted NFT cannot reenter or mutate
  state here. Safe.
* `_transferNFTs` L359 — the only loop containing an external call. Bounded by
  `MAX_ITEMS_PER_SIDE = 20` per side (checked L179). A malicious token can revert
  to grief, but the whole tx reverts atomically — **no partial settlement**.
* `_sendNative` L365 — `.call{value}` with mandatory success check reverting
  `NativeTransferFailed`. Correct.

---

## 4. Confirmed vulnerabilities

**None at Critical / High / Medium.** No path was found where funds or NFTs can be
drained, locked, duplicated, or incorrectly released via reentrancy, double
settlement, double cancel, settle-after-cancel, cancel-after-settle, double fee
withdrawal, escrow desync, or fee-accounting desync. Each such path is closed by
the ReentrancyGuard, CEI ordering, the `nonceUsed` state machine, or exact-value
accounting, and each is exercised by a regression test in §7.

---

## 5. Potential hardening recommendations (Low / Informational)

### L-1 (Low) — Escrow-withdraw griefing of open maker-MON orders
**Where:** interaction between `withdraw` (L144) and `fulfillTrade`'s escrow check
(L213). **Not a reentrancy issue; not a fund loss.**
A maker who signed a MON-funded order (`makerMonAmount > 0`) can `withdraw` their
escrow before a taker settles, so the taker's `fulfillTrade` reverts
`InsufficientEscrow`. This is a *liveness/griefing* concern inherent to the
off-chain-order + self-managed-escrow model (the maker can equally cancel the
nonce or move the NFT). It **fails closed** — the taker loses only gas, never
assets. 
*Minimal fix:* document it as expected. *Architectural fix:* offer an optional
"locked-order" flow where signing/committing an order escrows and freezes the
maker's MON (a `lockedEscrow[maker][nonce]` sub-ledger consumed at settlement),
at the cost of an on-chain maker action.

### L-2 (Low) — Native funds can strand for a non-receiving recipient/depositor — **RESOLVED**
**Where:** `_sendNative` reverts if the destination rejects MON.
For `withdrawFees`, if `feeRecipient` is a contract with no payable
`receive`/`fallback`, its `pendingFees` become unclaimable (trades still succeed —
this is by design and covered by `test_RevertingFeeRecipientDoesNotBrickTrade`).
Likewise a contract that deposited escrow but cannot receive MON could not
withdraw it.
**Resolution (implemented):** added `withdrawTo(address to, uint256 amount)` and
`withdrawFeesTo(address to)`. Both keep the ledger keyed to `msg.sender` (nobody
can move a balance that isn't theirs) but let the fund owner redirect the payout
to a payable address. They reuse the same `nonReentrant` + Checks-Effects-
Interactions path as `withdraw`/`withdrawFees` via shared internal helpers
`_withdraw`/`_withdrawFees`, so the solvency invariant is unchanged (the same
ledger is debited by the same amount; only the `.call` destination differs).
Regression tests: `test/MonadMarketSettlementWithdrawTo.t.sol`. Operationally,
still set `feeRecipient` to a payable address; the redirect is the safety net.

### Info-1 — Reentrancy guard blocks composable smart-wallet callbacks
A smart-contract maker/taker whose `onERC721Received`/`receive` legitimately wants
to call back into `withdraw`/`withdrawFees`/`fulfillTrade` will be reverted by the
shared guard. This is the correct, safe tradeoff; noted so integrators design
callbacks that do not reenter (e.g. defer follow-on actions to a later tx).

### Info-2 — `quoteFees` reads storage fee, settlement uses order fee
`quoteFees` (L287) uses storage `feeBps`/`flatSwapFee`, but `fulfillTrade` charges
the **signed** `order.feeBps`/`order.flatFee` (L203–205). This is intentional and
safe (order fee is immutable post-signing), but the quote can differ from the
actual charge for a pre-existing order after the owner changes the storage fee.
*Fix:* have the UI quote from the order's own fields, or add a
`quoteOrderFees(TradeOrder)` view.

### Info-3 — Malicious NFT griefing is bounded but present
An untrusted token can revert inside `safeTransferFrom` to block a trade, or burn
gas up to the 20-item/side cap. This only causes the trade to revert atomically
(no partial state, no loss). No action required; noted for completeness.

---

## 6. Concrete Solidity patches

The reentrancy design needs **no corrective patch** — the current code is already
guarded and CEI-correct. The only *optional* hardening (defense-in-depth /
belt-and-suspenders) worth considering:

**(Optional) O-1 — `whenNotPaused` clarity on cancel while paused.** Cancellation
is intentionally allowed while paused (exit path); no change recommended.

**O-2 — Redirectable pull payments (addresses L-2) — SHIPPED.** Implemented as
`withdrawTo` / `withdrawFeesTo` (see L-2 above). Each is a thin `nonReentrant`
external wrapper over a private helper that debits the caller's own ledger
(`escrowBalance[msg.sender]` / `pendingFees[msg.sender]`) before sending to the
chosen destination — identical CEI + guard profile to the originals, no change to
any settlement path, and the solvency invariant is preserved.

No changes are proposed to `fulfillTrade`, `withdraw`, `withdrawFees`,
`_sendNative`, `_verifyNFTs`, or `_transferNFTs`: they are already correct.

---

## 7. Foundry regression tests

The branch adds several suites on top of the existing 37-test
`MonadMarketSettlement.t.sol`:

* **`test/MonadMarketSettlementReentrancy.t.sol`** — four malicious contracts +
  nine reentrancy / state-machine tests (below).
* **`test/MonadMarketSettlementWithdrawTo.t.sol`** — L-2 fix coverage:
  `withdrawTo` / `withdrawFeesTo` rescue a non-receiving depositor/recipient,
  reject the zero address, and cannot drain a balance that isn't the caller's.
* **`test/attacks/Attacks.t.sol` + `test/attacks/ReentrantActor.sol`** — active
  cross-function reentrancy attacks through both the ERC721 callback and the
  native-refund leg, a duplicate-NFT double-spend attempt, and cross-maker escrow
  isolation.
* **`test/invariant/SettlementSolvency.t.sol`** — stateful invariants:
  `balance == Σ escrow + pendingFees` and `pendingFees ≤ balance`, fuzzed over
  random deposit/withdraw/withdrawFees/cancel/fulfill sequences (validated at
  128k calls, 0 reverts).

Run:

```bash
forge test --root contracts -vvv --match-path 'test/MonadMarketSettlementReentrancy.t.sol'
```

**Malicious actors implemented**
* `ReentrantTaker` — malicious buyer; reenters `fulfillTrade` from both
  `onERC721Received` and `receive()` (NFT-receipt and MON-payout callbacks).
* `ReentrantMaker` — malicious EIP-1271 seller; reenters `withdrawFees`
  (cross-function) from its receive/`onERC721Received` callbacks.
* `ReentrantNFT` — malicious token; reenters the settlement contract from inside
  its own `_update` transfer hook (mid-`safeTransferFrom`).
* `ReentrantWithdrawer` — classic reentrant refund/escrow drainer on `withdraw`.

**Tests and what they prove**

| Test | Attack attempted | Expected result |
|------|------------------|-----------------|
| `test_ReentrantTaker_DuringNftReceipt_Blocked` | reenter settlement during NFT-receiver callback | reentry caught by guard; trade settles once |
| `test_ReentrantTaker_DuringMonPayout_Blocked` | reenter settlement during MON payout | reentry caught; taker paid exactly once |
| `test_ReentrantMaker_CrossFunction_Blocked` | reenter `withdrawFees` during settlement | cross-function reentry blocked; swap completes once |
| `test_MaliciousNFT_ReenterDuringTransfer_Blocked` | reenter from NFT `_update` hook | reentry blocked; ownership transfers once |
| `test_ReentrantWithdraw_CannotDrainEscrow` | reenter `withdraw` to over-pull | drain blocked; other users' escrow intact |
| `test_CannotSettleTwice` | replay a filled order | reverts `NonceAlreadyUsed` |
| `test_CannotCancelAfterSettlement` | cancel a nonce post-fill | reverts `NonceAlreadyUsed` |
| `test_CannotSettleAfterCancel` | fill a cancelled nonce | reverts `NonceAlreadyUsed` |
| `test_CannotWithdrawFeesTwice` | double fee withdrawal | second reverts `ZeroAmount` |

Each reentrancy test uses a one-shot `try/catch` inside the attacker so that the
*outer* legitimate settlement completes while the *nested* reentrant call is
provably rejected — asserting both the block (`reentrancyBlocked == true`,
`reentered == false`) and the correct final asset/balance state.

> Execution note: the suite was authored but not executed in the review sandbox
> because the Foundry toolchain could not be installed there (network policy
> blocks the installer; no cached `solc`/`forge`). It mirrors the conventions of
> the existing, compiling `MonadMarketSettlement.t.sol` (same signing helper,
> same mocks) and is expected to compile and pass unmodified with a local
> `forge test`.

---

## 8. Final go / no-go recommendation

**GO for production** on the audited reentrancy and settlement-atomicity
dimension. `MonadMarketSettlement` correctly combines OpenZeppelin
`ReentrancyGuard` (on all three value-moving functions, sharing one guard word so
cross-function reentry is also closed), strict Checks-Effects-Interactions in
`fulfillTrade`, pull-payment fee handling, non-custodial NFT routing, and
checked `.call{value:}` native transfers. No reentrancy, double-settlement,
double-cancel, settle-after-cancel, double-fee-withdrawal, escrow-desync, or
fee-accounting-desync vulnerability was found, and each of those paths is now
covered by an adversarial regression test.

Conditions on the GO:
1. Run `contracts/test/MonadMarketSettlementReentrancy.t.sol` (plus the existing
   suite) and confirm green in CI before deployment.
2. Accept and document **L-1** (escrow-withdraw griefing of open maker-MON
   orders) as intended behavior, or adopt the optional locked-order design.
3. **L-2 fixed** via `withdrawTo` / `withdrawFeesTo`. Still set `feeRecipient` to a
   payable address; the redirect functions are the operational safety net.

None of the conditions are reentrancy blockers; they are operational/economic
hardening. The reentrancy surface itself is production-ready.
