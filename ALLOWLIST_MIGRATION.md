# Collection Allowlist — Deployment & Migration Runbook

This change adds an owner-managed, timelocked **collection allowlist** to
`Handshake` (see `contracts/src/Handshake.sol`). Because `Handshake` is **not
upgradeable** (no proxy, no initializer — verified), shipping this fix to the
live deployment is a **redeploy + migration**, not an in-place patch. This
document is the operational runbook.

> Live contract at time of writing: `0x72F3E21c12E85F2043e316737179734b30c87533`
> (`NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS`). Treat it as holding real user
> funds.

---

## 1. What changed and why it forces a redeploy

`_verifyNFTs` / `_transferNFTs` trusted each collection's `ownerOf`. A malicious
collection can make `ownerOf` return `maker` before a transfer and `taker`
after, defeating both the pre-check and the post-transfer effectiveness check —
so an attacker-maker can receive a real NFT/MON leg for a token that never
moved. The fix restricts *which collection addresses can be traded* via an
allowlist, rejecting non-allowlisted collections **before** their `ownerOf` is
ever called.

The fix touches contract code **and** the constructor signature
(`initialCollections` seed). With no proxy, any code change requires deploying a
fresh contract at a new address.

---

## 2. The old contract stays vulnerable until users leave it

The old contract cannot be fixed. Until users migrate off it, the lying-`ownerOf`
vector remains exploitable there. The attack requires a taker to fill an order
referencing the malicious collection — the app UI only surfaces known
collections, but **anyone can call `fulfillTrade` directly**, so this is live
risk, not theoretical.

**Recommended immediately, before/at the start of migration:**

1. **`pause()` the old contract** (owner action). Pausing blocks new
   `fulfillTrade` settlements but— by design — leaves `withdraw`, `withdrawTo`,
   `withdrawFees`, `withdrawFeesTo`, `cancelNonce(s)`, and `cancelNonceFor`
   open, so users can always exit their escrow and fees and revoke resting
   orders.
2. Announce the migration and the new address to users.

---

## 3. Deploy the new contract

Env (server-side only — never commit real values):

```bash
export MONAD_RPC_URL=...            # Monad mainnet RPC
export PRIVATE_KEY_DEPLOYER=0x...   # deployer key
export FEE_RECIPIENT_ADDRESS=0x...  # unchanged from current config
export CONTRACT_OWNER=0x...         # STRONGLY recommend a multisig (see §6)
# Optional launch allowlist — comma-separated, seeded tradable in the deploy
# block with NO timelock (deployer is the trust root at genesis):
export INITIAL_COLLECTIONS=0xCollectionA,0xCollectionB
```

Deploy:

```bash
npm run contracts:deploy
# → forge script contracts/script/Deploy.s.sol:Deploy --root contracts \
#     --rpc-url $MONAD_RPC_URL --broadcast
```

The script logs the new address, owner, fee recipient, fee bps, and every seeded
collection. Record the new address.

**Seed policy:** only seed collections you already trust and have vetted. Every
collection added *after* deployment must go through `proposeCollection`, which
enforces the `ADD_DELAY` (48h) timelock. Adds are delayed; `removeCollection` is
instant.

**Vetting checklist (per collection, before seeding or proposing):**

- [ ] It is a real ERC-721 whose `ownerOf`/`transferFrom` behave honestly.
- [ ] **Upgradeability:** is the collection an upgradeable proxy? The allowlist
      trusts a collection *address*, but a proxy can have its implementation
      swapped **after** it clears the timelock — same address, new (possibly
      malicious, lying-`ownerOf`) code, with no re-proposal and no delay. This
      is the sharpest residual in the "allowlisted == trusted" model. If the
      collection is a proxy, identify who controls the upgrade key and treat an
      unknown/EOA-controlled upgrader as **disqualifying**, even if today's
      bytecode is honest. Prefer immutable (non-proxy) collections; where a
      proxy must be listed, rely on `pause()` + monitoring (§6) as the only
      defense once it turns hostile.
- [ ] No known admin/mint/rug powers that would let the collection owner grief
      settled trades.

---

## 4. Cut over

1. **Frontend:** set `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` to the new
   address and redeploy the app. Gate order creation on
   `isCollectionAllowed(collection)` (new view) so users cannot build orders
   that would revert with `CollectionNotAllowed` at fill time.
2. **Indexers / monitors:** point event listeners at the new address. Start
   watching `CollectionProposed` (see §6).
3. **Resting orders die automatically.** The old contract's address is baked
   into the EIP-712 domain (`verifyingContract`), so no signature created for
   the old contract validates against the new one — there is no cross-contract
   replay. Users simply re-sign orders against the new deployment.
4. **Escrow migration is user-driven.** Escrow balances do not move
   automatically. Each user withdraws from the old contract
   (`withdraw`/`withdrawTo`, available even while paused) and, if desired,
   `deposit`s into the new one. Fee recipient claims any `pendingFees` from the
   old contract via `withdrawFees`.

---

## 5. Post-migration validation

- [ ] New address verified on the explorer; owner == intended multisig.
- [ ] Seeded collections return `true` from `isCollectionAllowed`; a random
      unlisted collection returns `false`.
- [ ] A canary trade between two seeded collections settles; `TradeExecuted`
      fires; solvency holds (`address(this).balance == Σ escrowBalance +
      Σ pendingFees`).
- [ ] A trade referencing an unlisted collection reverts `CollectionNotAllowed`.
- [ ] Old contract is paused; users can still withdraw from it.
- [ ] Frontend blocks order creation for non-allowlisted collections.
- [ ] `CollectionProposed` monitoring is live and alerting.

---

## 6. Ongoing operations (the allowlist's security depends on these)

- **Multisig owner.** The allowlist bounds a *single* compromised key (it cannot
  list-and-drain in one block — the collection sits pending for `ADD_DELAY`),
  but a multisig removes the single point of failure that could `proposeCollection`
  at all. Use one.
- **Watch the delay window.** The 48h asymmetry is only a defense if someone is
  watching. Run a monitor that alerts on every `CollectionProposed` and gives an
  operator a one-click `removeCollection` (instant) during the pending window.
- **Keep `pause()` as the circuit breaker** for anything the allowlist can't
  undo fast enough.

---

## 7. What this does and does not protect against

**Protects:** trading arbitrary/malicious collections, including the
lying-`ownerOf` vector (rejected before invocation) and accidental listings (48h
public pending window); bounds a compromised owner key.

**Does not protect:** a malicious collection that is allowlisted and stays live
past the timelock (allowlisted == trusted, by design); an owner who is malicious
*and* patient with nobody watching the window; or rug/bug behavior *inside* a
legitimately listed collection — including an **upgradeable-proxy collection
whose implementation is swapped to lying code after it clears the timelock**
(see the §3 vetting checklist; the address stays trusted, so only `pause()` +
monitoring defend against it). The allowlist grants the owner **zero** power
over escrow, pending fees, or user assets — only over which collections trade.
