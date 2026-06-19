# Handshake — Security Audit

**Product:** Handshake — peer-to-peer NFT trading on Monad (on-chain contract name `MonadMarketSettlement`, EIP-712 domain `MonadMarket`).
**Settlement contract:** [`0xA9E7f8D08ecd275D9Dd7C95cF9a557B8bce4a277`](https://monadscan.com/address/0xA9E7f8D08ecd275D9Dd7C95cF9a557B8bce4a277#code) — Monad Mainnet (chain 143), source-verified on MonadScan (Solidity 0.8.28, optimizer 1000 runs, EVM cancun, MIT).
**Last updated:** 2026-06-19.
**Scope:** Settlement contract, Next.js API + frontend, database schema, and operational readiness. This is a best-effort internal review — **not** a substitute for an independent third-party audit before scaling real value.

---

## Executive Summary

Handshake settles off-chain EIP-712 maker orders through a non-custodial on-chain contract. The design is sound: signatures are chain/contract-bound, settlement is atomic, replay protection and cancellation are on-chain, fees are fixed into the signed order, and all database access goes through a server-only service-role layer.

The high- and medium-severity findings from the original review have been remediated (see [Changelog](#remediated-changelog)). What remains is **operational governance and assurance work** — finishing the multisig ownership handoff and obtaining an independent contract audit — plus a couple of low-risk product hardening items.

## Risk Ratings

| Area | Rating | Notes |
| --- | --- | --- |
| Smart-contract design | **Low–Medium** | Non-custodial, reentrancy-guarded, order-bound fees, pull-payment fees, `Pausable`. Verified on mainnet. Independent audit still recommended. |
| API & backend | **Low** | Strong validation; signature-authenticated mutations; SSRF-guarded metadata; distributed rate limiting. |
| Frontend & wallet UX | **Low–Medium** | Network guard, pre-flight simulation, explicit approval and visibility warnings. |
| Data & privacy | **Medium** | "Private/unlisted" offers are feed-hidden but viewable by direct link (labelled as such). |
| Production operations | **Medium** | Owner→multisig handoff in progress; monitoring/alerting and external audit still to do. |

---

## Security Posture (current strengths)

### Smart contract
- EIP-712 order hash bound to chain id + verifying contract; `_hashTypedDataV4`.
- Enforces expiry, designated taker, non-self-trade, nonce consumption, per-side item limits, and empty-side checks.
- On-chain replay/cancel protection via `nonceUsed[maker][nonce]`.
- Checks-effects-interactions with `nonReentrant`; NFT ownership and approval verified immediately before transfer.
- **Fees are baked into the signed order** (`feeBps`, `flatFee`) — the owner cannot change the fee on an already-signed order; bounded by `MAX_FEE_BPS` (5%) and `MAX_FLAT_SWAP_FEE` (1 MON).
- **Pull-payment fees** (`pendingFees` / `withdrawFees`) — a reverting fee recipient cannot brick trades.
- **`Pausable`** emergency stop on `fulfillTrade`; escrow withdrawal, fee withdrawal, and nonce cancellation stay available while paused.
- Maker-side MON uses self-managed escrow; owner functions can never move user NFTs or escrow.

### Backend / API
- Inputs validated with Zod; maker signatures re-verified server-side before storage.
- Completion verifies the on-chain `TradeExecuted` receipt **and** that the submitted taker matches the event; cancellation verifies on-chain `nonceUsed`.
- Wanted-board posts/deletes require an EIP-191 wallet signature (timestamped) — no impersonation.
- NFT metadata fetching is SSRF-guarded: private/link-local/metadata IP ranges blocked after DNS, scheme allowlist, 512 KB response cap, LRU-bounded cache.
- Distributed rate limiting via Upstash Redis (in-memory fallback for single instance).
- RLS enabled on all tables; service-role access server-side only.
- HTTP security headers incl. CSP, `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- `/api/health` checks chain id, deployed settlement bytecode, and DB connectivity.

### Frontend / UX
- Wallet network guard; pre-flight settlement simulation surfaces exact revert reasons before gas is spent.
- Create wizard and accept/approve flows state plainly that `setApprovalForAll` grants collection-wide transfer permission until revoked, and that only the signed trade's NFTs move.

---

## Open Items

### Operational (do before scaling real value)

- **O-1 — Owner is not yet a multisig.** Ownership is mid-handoff from the deployer EOA to a Safe (`0xBF8edB45cf8795f946A3Ddb0bAAAA190DC062638`) via `Ownable2Step`. Finish the `acceptOwnership()` step and confirm `owner()` before relying on it. *(In progress.)*
- **O-2 — Independent external contract audit.** Self/internal review is not a substitute. Commission a third-party audit (or a reputable contest) before mainnet volume.
- **O-3 — Monitoring & incident runbook.** Add alerting for API error rates, failed settlements, rate-limit hits, and unusual metadata fetch volume; document a pause/response procedure.

### Product hardening (low risk)

- **P-1 — Direct-link privacy.** `getOfferById` returns any offer by UUID, so "private/unlisted" offers are viewable by anyone with the link. Labelled accurately today; true privacy would require wallet-authenticated access checks.
- **P-2 — Broad image host allow-list.** `next.config.ts` permits any HTTPS host for `next/image`. Mitigated in practice (NFT art renders via plain `<img>`); tighten to trusted gateways or an image proxy if optimization is enabled.
- **P-3 — ERC-721 only.** No ERC-1155 yet; keep messaging explicit and add it only with separate typed order fields and tests.
- **P-4 — Expired-offer cleanup.** Expired offers remain `open` in the DB until filtered out server-side; add a scheduled cleanup or status reconciliation.
- **P-5 — Optional fee timelock.** Even under a multisig, consider a timelock on fee-parameter changes for stronger user guarantees.

---

## Pre-Mainnet Checklist

- [x] Contract deployed on Monad mainnet and source-verified on MonadScan.
- [x] Fees bound into signed orders; flat-fee cap; pull-payment fees; `Pausable`.
- [x] Distributed rate limiting; SSRF guards; security headers + CSP.
- [x] Wanted-board signature auth; completion taker verification.
- [ ] Owner moved to multisig (`Ownable2Step` accept) — **in progress**.
- [ ] Independent external smart-contract audit.
- [ ] Monitoring/alerting and incident runbook.
- [ ] Scheduled expired-offer cleanup.

---

## Remediated (changelog)

The following were identified in the original review and have since been fixed:

| ID | Finding | Resolution |
| --- | --- | --- |
| H-01 | Wanted board unauthenticated (impersonation) | EIP-191 signed, timestamped posts/deletes |
| H-02 | In-memory rate limiting bypassable on serverless | Upstash Redis distributed limiter |
| H-03 | Metadata fetch SSRF / unbounded cache | IP/scheme/size guards + LRU cache (`lib/nft/safe-fetch.ts`) |
| H-04 | (image host allow-list) | Partially mitigated — see P-2 |
| M-01 | Missing HTTP security headers | Full header set incl. CSP |
| M-02 | "Private" offers mislabelled | Relabelled "Private/unlisted"; behaviour tracked as P-1 |
| M-03 | Completion ignored submitted taker | Now verified against the `TradeExecuted` event |
| M-06 | Fee-admin centralization / uncapped flat fee | Order-bound fees + `MAX_FLAT_SWAP_FEE`; multisig tracked as O-1 |
| L-01 | Silent env misconfiguration | `/api/health` validates chain/contract/DB |
| — | No emergency pause | `Pausable` added |
| — | Fee recipient could brick trades | Pull-payment fees |

---

## Conclusion

Handshake has a solid, non-custodial foundation: the settlement path is carefully designed, fees are fixed at signing, the backend verifies on-chain facts before mutating state, and the contract is deployed and verified on Monad mainnet with an emergency pause. The remaining work is governance and assurance — **complete the multisig handoff and commission an independent contract audit** before treating it as production-grade for significant value.
