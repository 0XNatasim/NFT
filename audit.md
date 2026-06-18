# Monad Market Max-Level Audit

**Target:** https://nft-vert-three.vercel.app/  
**Audit date:** 2026-06-17  
**Last updated:** 2026-06-17 (post-remediation)  
**Scope:** Live deployment smoke review, Next.js API/frontend review, database schema review, settlement-contract review, test-suite review, and operational-readiness review. This is a best-effort audit from the repository and publicly reachable site, not a substitute for a formal mainnet audit with deployed-bytecode verification, private infrastructure review, and adversarial testing against production credentials.

## Remediation Status (2026-06-17)

Several findings from the original audit have since been fixed in the codebase. Each finding below carries a **Status** line. Summary:

- **Resolved:** H-01 (wanted posts now require EIP-191 wallet signatures), H-02 (rate limiting now backs onto Upstash Redis across instances), H-03 (SSRF guard, IP/scheme/size limits, bounded cache), M-01 (security headers incl. CSP), M-03 (completion verifies submitted taker against the event), L-01 (`/api/health` checks chain/contract/DB).
- **Deployment milestone:** the `MonadMarketSettlement` contract is deployed and **source-verified on MonadScan** at `0xfb719aad46eaf2503f030bbd884a5ed5958eab1e` (Monad Testnet, Solidity 0.8.28, optimizer 1000 runs, EVM cancun, MIT).
- **Still open:** H-04 (image `remotePatterns` allow any HTTPS host), M-05/M-06 (ERC-721-only messaging; fee-admin centralization / uncapped flat swap fee), and the lack of a contract pause mechanism. These are tracked below.

## Executive Summary

Monad Market is a peer-to-peer NFT trading application for Monad that uses off-chain EIP-712 maker orders and an on-chain non-custodial settlement contract. The core architecture is strong: signatures are chain/contract-bound, settlement is atomic, replay protection is on-chain, completion/cancellation APIs verify on-chain facts, and Supabase is accessed only through a service-role server layer.

However, the project is **not mainnet-ready** without addressing several high-impact operational and security gaps. The most important issues are: unauthenticated wanted-board posting, broad remote-image allow-listing, missing HTTP security headers in app config, in-memory rate limiting that does not hold across Vercel instances, unbounded metadata fetch/cache behavior that can be abused for SSRF-like outbound requests and memory pressure, and the need to verify deployed contract address/bytecode and production environment configuration before real-value use.

## Overall Risk Rating

| Area | Rating | Notes |
| --- | --- | --- |
| Smart contract custody/settlement design | **Medium** | Good non-custodial design and tests; source now verified on MonadScan. Formal external audit still required; no pause mechanism. |
| API and backend | **Medium** | Strong validation in trade flows; wanted board now signature-authenticated; rate limiting distributable via Upstash. |
| Frontend and wallet UX | **Medium** | Good network guard and simulations; approvals and private-link semantics need clearer warnings. |
| Data/privacy | **Medium** | Private offers are feed-hidden, not cryptographically private; direct-link access remains possible. |
| Production operations | **Medium** | Security headers + CSP added, distributed rate limit available, health check present. Monitoring/alerting still to add. |

## Methodology

1. Loaded the live site landing page and confirmed the primary navigation and marketplace copy are reachable.
2. Reviewed repository implementation across the settlement contract, Next.js routes, validation, database schema, frontend trade flows, metadata fetchers, and deployment config.
3. Ran local automated checks: TypeScript, Vitest, and production build.
4. Attempted a terminal-level live header/API check. The local shell environment received an Envoy `403` on CONNECT tunneling, so browser/tool-based live page inspection was used instead for the public site.

## Live Site Observations

- The homepage loads and presents Monad Market as a wallet-to-wallet NFT trading desk with Create Trade, Wanted, and Account navigation.
- The live page advertises atomic settlement, private offers, open offers, and recent trades.
- Runtime API/header verification from the terminal was blocked by the execution environment's outbound CONNECT policy, so security-header findings are based on repository configuration rather than a successful `curl -I` response.

## Positive Security Findings

### Smart Contract

- EIP-712 signatures are bound to the `MonadMarket` domain and version, and order hashes use `_hashTypedDataV4`.
- Orders enforce expiry, designated taker, non-self-trade, nonce consumption, item-count limits, and empty-side checks.
- Replay/cancel protection is on-chain through `nonceUsed[maker][nonce]`.
- Settlement follows checks-effects-interactions and uses `nonReentrant`.
- Maker-side MON uses self-managed escrow; owner functions cannot move user escrow.
- Fee controls are capped for percentage fees and are isolated to fee recipient/BPS/flat swap fee settings.
- NFT ownership and approval are checked immediately before transfers.

### Backend/API

- Offer creation validates inputs with Zod and re-verifies maker signatures before database insertion.
- Offer completion verifies a successful receipt and `TradeExecuted` event from the configured settlement contract before marking complete.
- Offer cancellation verifies on-chain `nonceUsed` before marking cancelled.
- Numeric database values that can exceed JavaScript safe integer limits are selected as text for offer reads.
- Private offers are excluded from the public feed by default.
- RLS is enabled on all Supabase tables and the application uses a server-only service-role client.

### Frontend/UX

- Wallet network guard warns users on the wrong chain.
- Create flow checks settlement contract configuration and requests approval before listing offered NFTs.
- Accept flow simulates settlement before sending the transaction, improving safety and error clarity.
- Maker escrow shortfall is surfaced on the offer detail page.

## Findings

### Critical Findings

No direct critical exploit was confirmed in the reviewed source. Critical status should remain blocked until deployed contract bytecode, production environment variables, Supabase policies, and monitoring are verified.

### High Severity

#### H-01: Wanted-board posts are unauthenticated and can impersonate any wallet

**Status: RESOLVED.** `POST /api/wanted` and `DELETE /api/wanted/[id]` now require an EIP-191 `personal_sign` signature from the claimed wallet over a fully reconstructed message that includes a timestamp (5-minute freshness window). Shared builders live in `lib/wanted/auth.ts`; the client signs via wagmi `useSignMessage`. Invalid/missing signatures return `401`.

**Location:** `app/api/wanted/route.ts`

The wanted-board POST endpoint accepts `walletAddress`, `lookingFor`, `offering`, and `notes`, but does not require a wallet signature. Anyone can post as any wallet address. This can be used for impersonation, phishing, reputation damage, scam listings, and spam.

**Impact:** High for trust and abuse resistance. Users may believe a wanted post belongs to a wallet that never authored it.

**Recommendation:** Require SIWE or EIP-191/EIP-712 signed messages for wanted posts. Verify that the submitted wallet signed the exact post payload and timestamp/nonce. Add edit/delete flows also requiring signatures.

#### H-02: In-memory rate limiting is not production-grade on Vercel/serverless

**Status: RESOLVED.** `lib/rate-limit.ts` now uses Upstash Redis (REST, fixed-window counter, single pipelined round trip, fails open on outage) when `UPSTASH_REDIS_REST_URL`/`_TOKEN` are configured, so limits hold across serverless instances. It falls back to the in-memory sliding window otherwise (acceptable for single-instance/dev). All call sites are awaited.

**Location:** `lib/rate-limit.ts`

The rate limiter uses a process-local `Map`. On serverless/multi-instance deployments, limits are bypassed across cold starts and instances. Attackers can spray requests across instances, and memory state is lost unpredictably.

**Impact:** High for API abuse, NFT metadata fetch amplification, wanted-board spam, and offer-creation attempts.

**Recommendation:** Replace with Upstash Redis, Vercel KV, Cloudflare Turnstile-backed challenge flows for abuse-prone endpoints, or a provider-level WAF/rate-limit rule. Rate-limit by wallet and IP where possible.

#### H-03: Metadata fetching can trigger arbitrary outbound requests and memory pressure

**Status: RESOLVED.** `lib/nft/safe-fetch.ts` blocks private/link-local/cloud-metadata IP ranges after DNS resolution (10/8, 127.0.0.1, 169.254/16, 172.16/12, 192.168/16, IPv6 ULA/link-local), enforces an http/https scheme allowlist, and caps responses at 512 KB via both `content-length` and a streamed byte counter. The metadata cache is LRU-bounded (5000 entries).

**Location:** `lib/nft/safe-fetch.ts`, `lib/nft/onchain-metadata.ts`, `app/api/token-metadata/route.ts`, `app/api/nfts/route.ts`

The server reads tokenURI from arbitrary ERC-721 contracts and fetches the resolved URI with an 8-second timeout. HTTP(S) URIs returned by contracts are fetched without an allow-list, IP-range restrictions, content-length cap, or response-size cap. Token metadata is cached in unbounded process-local maps.

**Impact:** High in adversarial environments. Attackers can deploy NFTs whose `tokenURI` points at internal/private network ranges, very slow endpoints, huge JSON payloads, or high-cardinality URLs/tokens to consume memory and outbound capacity.

**Recommendation:** Add URL scheme allow-listing, block private/link-local/metadata IP ranges after DNS resolution, set strict max response size, validate content type, bound caches with LRU/TTL, and move metadata ingestion to a queue with observability and provider allow-lists.

#### H-04: Broad image remote pattern allows any HTTPS host

**Status: OPEN (partially mitigated).** `next.config.ts` still sets `remotePatterns: [{ protocol: "https", hostname: "**" }]`. Mitigated in practice because NFT artwork is rendered with a plain `<img>` (no Next image optimizer), so this only governs incidental `next/image` use. Recommend restricting to trusted gateways or a dedicated image proxy before mainnet.

**Location:** `next.config.ts`

Next Image remote patterns allow `https://**`. This enables the application/image optimizer to request images from arbitrary HTTPS domains, increasing SSRF-like outbound request surface and image optimization abuse.

**Impact:** High operational abuse risk, especially combined with untrusted NFT metadata.

**Recommendation:** Restrict image hosts to trusted gateways and NFT providers, or use a dedicated image proxy with IP blocking, size limits, and abuse controls. Consider disabling optimization for unknown NFT images.

### Medium Severity

#### M-01: Missing explicit HTTP security headers in Next.js config

**Status: RESOLVED.** `next.config.ts` now sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, HSTS, and a `Content-Security-Policy` tuned for the wallet dApp (`frame-ancestors 'none'`, `object-src 'none'`, scoped script/style/connect/img sources).

**Location:** `next.config.ts`

No custom `headers()` configuration is present for CSP, frame-ancestors, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, or HSTS. Vercel may provide some defaults, but application-level policy is absent.

**Impact:** Medium. A wallet/trading application benefits from strong clickjacking, script, and data-exfiltration boundaries.

**Recommendation:** Add a conservative CSP compatible with RainbowKit/wallet providers, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and HSTS for production domains.

#### M-02: Private offers are hidden, not private

**Location:** `lib/db/offers.ts`, `app/offers/[id]/page.tsx`

Private offers are excluded from the public feed unless queried by maker/taker filters, but `getOfferById` returns any offer by UUID. Anyone with the direct URL can view details. This may be acceptable product behavior, but the label can mislead users.

**Impact:** Medium privacy/trust risk.

**Recommendation:** Rename to “unlisted targeted offer” or add wallet-authenticated access checks for private offers. If true privacy is required, do not expose full offer terms without proof of maker/taker wallet control.

#### M-03: Completion endpoint ignores submitted takerAddress

**Status: RESOLVED.** `complete/route.ts` now rejects with `409` when the submitted `takerAddress` does not match the taker decoded from the on-chain `TradeExecuted` event.

**Location:** `app/api/offers/[id]/complete/route.ts`, `lib/validation/offers.ts`

The schema requires `takerAddress`, but completion derives the taker from the settlement event and does not compare the submitted value. This is not a direct integrity issue because event verification is authoritative, but it is confusing and weakens auditability.

**Impact:** Medium-low integrity/consistency issue.

**Recommendation:** Either remove `takerAddress` from the schema or verify it matches the decoded event taker.

#### M-04: Wanted-board text fields need rendering/audit confirmation

**Location:** `app/api/wanted/route.ts`, `supabase/migrations/20260610000000_init.sql`

Wanted posts accept free-form strings. React escaping normally prevents direct XSS if rendered as text, but markdown/linkification or future rich rendering could introduce risk.

**Impact:** Medium if rendering changes.

**Recommendation:** Keep wanted content text-only, sanitize on render if rich text is added, and add moderation/reporting controls.

#### M-05: ERC-721-only settlement limits can create product/user-safety confusion

**Location:** `contracts/src/MonadMarketSettlement.sol`, `lib/validation/offers.ts`

The app stores `quantity` and token standard fields, but settlement only supports ERC-721. Users may expect ERC-1155 or quantity semantics later.

**Impact:** Medium product correctness risk if UI/API expands without contract support.

**Recommendation:** Keep ERC-721 messaging explicit everywhere. Add ERC-1155 only with separate typed order fields and tests.

#### M-06: Fee-admin centralization and flat swap fee have no timelock

**Location:** `contracts/src/MonadMarketSettlement.sol`

The owner can update fee recipient, percentage fee up to 5%, and flat swap fee without delay. Percentage fees are capped; flat fees are not capped.

**Impact:** Medium trust/governance risk. Users may sign orders under one expected flat swap fee and settle under another if UI/contract state changes.

**Recommendation:** Use a multisig owner, disclose fee mutability, consider a timelock, and add a flat-fee cap or include fee parameters in signed order constraints.

### Low Severity / Hardening

#### L-01: Environment misconfiguration can silently degrade safety

**Status: RESOLVED.** `app/api/health/route.ts` returns `503` unless the settlement address is non-zero, the configured chain ID matches the RPC, the settlement contract has deployed bytecode, and the database is reachable.

The README lists many required environment variables. Production should fail closed if the settlement address is zero, RPC chain mismatches, NFT provider chain mismatches, or Supabase/service keys are missing.

**Recommendation:** Add startup/config validation and an `/api/health` route that checks chain ID, settlement code existence, Supabase connectivity, and provider configuration.

#### L-02: Expired offers remain open in database

The frontend treats expired offers as not acceptable, and the contract enforces expiry, but database status remains `open` until a cleanup job marks expired.

**Recommendation:** Add scheduled expiration cleanup or list filters that classify expired offers server-side.

#### L-03: Contract does not support ERC-721 tokens with non-standard transfer behavior

The contract uses `safeTransferFrom`, which is correct, but non-standard/broken NFTs can still revert. This is acceptable but should be surfaced in UI simulation errors.

#### L-04: Public offer data can expose metadata chosen by makers

NFT names, collection names, image URLs, and metadata are persisted from client input during offer creation. React escaping limits direct XSS, but future display contexts should treat these as untrusted.

**Recommendation:** Prefer server-side metadata normalization and sanitize before storage/display.

## Smart Contract Review Notes

### Strengths

- `fulfillTrade` rejects empty orders, excessive item counts, expired orders, wrong takers, self-trades, already-used nonces, invalid signatures, incorrect payments, insufficient escrow, missing ownership, and missing approvals.
- Nonce is marked used and escrow debited before external NFT/native transfers.
- Reentrancy is guarded on settlement and withdraw.
- Owner controls are restricted to fee settings.

### Residual Risks

- **Deployment status:** the contract is deployed and **source-verified on MonadScan** at `0xfb719aad46eaf2503f030bbd884a5ed5958eab1e` (Monad Testnet). Owner, `feeRecipient`, `feeBps`, and `flatSwapFee` are now publicly readable and should be confirmed before mainnet.
- Fee recipient could be a contract whose receive function reverts, causing all fee-bearing trades to fail.
- Flat swap fee has no max cap (still open).
- No emergency pause exists (still open). This reduces admin power but limits incident response.
- Formal verification/fuzzing should be expanded for multi-item swaps, fee edge cases, malicious receivers, and non-standard NFT contracts.

## API Review Notes

| Endpoint | Assessment |
| --- | --- |
| `GET /api/offers` | Validates filters and hides private offers from public listing. Good. |
| `POST /api/offers` | Validates, chain-checks, verifies signature. Good, but rate limit must be distributed. |
| `POST /api/offers/[id]/complete` | Verifies receipt and event. Good; compare/remove unused takerAddress. |
| `POST /api/offers/[id]/cancel` | Verifies maker wallet in body and on-chain nonce use. Good, but no signature on wallet body; on-chain check is the real authorization. |
| `GET /api/nfts` | Useful filtering/backfill, but metadata and provider calls need stronger abuse controls. |
| `GET /api/token-metadata` | High abuse surface without URL/IP/content-size controls. |
| `GET/POST /api/wanted` | GET is simple; POST needs wallet signature and moderation controls. |

## Database Review Notes

- RLS is enabled for all tables, and the API uses service-role access.
- Uniqueness constraints on order hash and `(chain_id, maker_address, nonce)` are appropriate.
- Numeric precision is handled carefully for offers reads.
- Wanted posts lack ownership proof and moderation state.
- Consider adding indexes for expiry cleanup and moderation queries.

## Frontend/UX Review Notes

- The network guard and settlement simulation are strong safety features.
- Approving entire NFT collections is standard but high-risk; users should see clearer copy that this grants settlement contract transfer permission for all NFTs in that collection until revoked.
- Private offer UX should clarify “unlisted/direct-link visible.”
- Maker MON escrow UX correctly warns that offered MON must be deposited; add withdrawal guidance and escrow dashboard visibility.

## Production Readiness Checklist

Before handling real value:

- [x] Verify deployed contract source matches the audited source and constructor args. *(Verified on MonadScan, Testnet `0xfb719aad46eaf2503f030bbd884a5ed5958eab1e`.)*
- [x] Publish the settlement contract address in README and app config.
- [ ] Put contract owner behind a multisig; consider timelock for fee changes.
- [x] Replace in-memory rate limiting with distributed rate limiting. *(Upstash Redis when configured.)*
- [x] Add wallet-signature auth to wanted posts and any user-generated claims.
- [x] Restrict metadata/image outbound fetches and bound caches. *(SSRF guard in `lib/nft/safe-fetch.ts`; image hosts still broad — see H-04.)*
- [x] Add HTTP security headers and CSP.
- [ ] Add monitoring/alerts for API error rates, failed settlements, rate-limit hits, and unusual metadata fetch volume.
- [ ] Add scheduled cleanup for expired offers.
- [ ] Run an external smart-contract audit and deployment review.

## Recommended Fix Priority

1. **Immediate:** ✅ Done — distributed rate limiting, wanted-post signatures, metadata fetch restrictions, and security headers/CSP are all in place. Remaining quick win: tighten image `remotePatterns` (H-04).
2. **Pre-mainnet:** Source is verified on MonadScan; still need multisig ownership, fee governance (flat-fee cap / timelock), a contract pause mechanism, a formal external contract audit, observability, and incident runbooks.
3. **Product hardening:** Clarify private/unlisted offers, collection approval warnings, escrow dashboard, moderation, and expired-offer cleanup.

## Automated Check Results

The local source checks completed successfully:

- `npm run typecheck` — passed.
- `npm run test` — passed.
- `npm run build` — could not complete in this environment because `next/font` could not fetch the Google Fonts `Inter` stylesheet; this is an environment/network limitation to address with local font hosting or build-network access.

The terminal live-site header/API check using `curl` could not complete because the environment returned `CONNECT tunnel failed, response 403`; this was treated as an environment limitation, not an application failure.

## Conclusion

Monad Market has a solid foundation for non-custodial P2P NFT trading. The settlement path is thoughtfully designed, and the backend verifies important on-chain facts before mutating offer state. The largest risks are production hardening and abuse resistance rather than a clearly confirmed direct settlement exploit. Address the high-severity findings before broader public use, and require an independent contract/deployment audit before any mainnet launch.
