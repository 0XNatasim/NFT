# Handshake

[![contracts](https://github.com/0XNatasim/NFT/actions/workflows/contracts.yml/badge.svg)](https://github.com/0XNatasim/NFT/actions/workflows/contracts.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Solidity 0.8.28](https://img.shields.io/badge/Solidity-0.8.28-363636)
[![Monad mainnet — verified](https://img.shields.io/badge/Monad%20mainnet-verified-836EF9)](https://monadscan.com/address/0x72F3E21c12E85F2043e316737179734b30c87533#code)

A peer-to-peer NFT trading marketplace for the Monad ecosystem — no bots, no snipers. Users negotiate and exchange NFTs directly wallet-to-wallet — NFT-for-NFT, NFT+MON, MON-for-NFT, private wallet-targeted offers — settled atomically by a non-custodial smart contract.

> The on-chain settlement contract keeps its original name (`Handshake`) and EIP-712 domain (`MonadMarket`) — these are baked into the deployed bytecode and every signature, so they must not be renamed. "Handshake" is the product brand only.

It's a trading desk, not a sniping ground: off-chain signed orders (free to create), offer expirations, private offers, wallet reputation, and no instant floor-sniping mechanics.

## What you need to run this project

Everything required before you can develop, deploy, and operate Handshake.

### 1. Tooling (local machine)

| Requirement | Version | Used for | Install |
| --- | --- | --- | --- |
| Node.js | 20+ (22 recommended) | Next.js app, tests | https://nodejs.org |
| npm | 10+ | dependency management, scripts | ships with Node |
| Foundry (`forge`, `cast`) | 1.0+ | compiling, testing, deploying the settlement contract | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Git | any recent | version control | — |

> Supabase CLI is optional — you can apply the migration through the Supabase dashboard's SQL editor instead.

### 2. Accounts & services to create

| Service | What to create | Why | Cost |
| --- | --- | --- | --- |
| **Supabase** (supabase.com) | A project | PostgreSQL database for offers, reputation, wanted board | free tier is fine |
| **WalletConnect / Reown** (cloud.reown.com) | A project ID | Required by RainbowKit for wallet connections | free |
| **Alchemy** (alchemy.com) — default provider | An API key with Monad enabled | NFT indexing (wallet NFTs, metadata) | free tier is fine |
| *or* **OpenSea** (opensea.io) | An API key | alternative NFT provider (`NFT_PROVIDER=opensea`); also powers floor-price (`PRICE_PROVIDER=opensea`) | free tier |
| **Vercel** (vercel.com) | A project linked to this repo | hosting the Next.js app | free tier |
| **A deployer wallet** | Fresh EOA + its private key | deploying the settlement contract | needs MON for gas |
| **Monad MON** | Real MON in the deployer wallet | gas for deployment + settling trades | — |

### 3. Setup steps (in order)

1. **Clone & install** — `npm install`, then `cp .env.example .env.local`.
2. **Supabase** — create the project, open *SQL Editor*, run every file in `supabase/migrations/` in order. Copy the project URL, anon key, and service-role key into `.env.local`.
3. **Deploy the contract** — fund the deployer wallet with MON, set the deployment vars (table below), then `npm run contracts:deploy`. Copy the printed address into `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS`. (Already deployed — see [Deployed contracts](#deployed-contracts).)
4. **Run locally** — `npm run dev` and connect a wallet on Monad mainnet.
5. **Deploy to Vercel** — import the repo, set every variable from the table below in the Vercel project settings, deploy.

### 4. Environment variables

All of these live in `.env.example`. ★ = required for the app to function.

**Public (exposed to the browser, prefix `NEXT_PUBLIC_`)**

| Variable | ★ | Value / where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | | Display name, e.g. `Handshake` |
| `NEXT_PUBLIC_CHAIN_ID` | ★ | `143` (Monad mainnet) |
| `NEXT_PUBLIC_MONAD_RPC_URL` | ★ | `https://rpc.monad.xyz` or your own RPC |
| `NEXT_PUBLIC_MONAD_EXPLORER_URL` | ★ | `https://monadscan.com` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ★ | Project ID from cloud.reown.com |
| `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` | ★ | `0x72F3E21c12E85F2043e316737179734b30c87533` (see [Deployed contracts](#deployed-contracts)) |
| `NEXT_PUBLIC_SUPABASE_URL` | ★ | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ★ | Supabase → Project Settings → API |

**Server-only (never expose; set in Vercel as plain env vars)**

| Variable | ★ | Value / where to get it |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | ★ | Supabase → Project Settings → API (service_role). Bypasses RLS — server only. |
| `NFT_PROVIDER` | ★ | `alchemy` (default) or `opensea` |
| `ALCHEMY_API_KEY` | ★ (if alchemy) | Alchemy dashboard → app → API key |
| `OPENSEA_API_KEY` | (if opensea / optional collection logo fallback) | OpenSea dashboard |
| `RESERVOIR_API_KEY` | | Reservoir dashboard — collection logo/floor metadata; unauthenticated requests are attempted when unset |
| `PRICE_PROVIDER` | | `opensea` — live floor price on NFT cards |
| `RESERVOIR_API_BASE_URL` | | Optional Reservoir-compatible API base URL; defaults to `https://api.reservoir.tools` |
| `RESERVOIR_API_BASE_<CHAIN_ID>` | | Optional per-chain Reservoir-compatible API base URL override, e.g. Monad-specific deployments |
| `SIMPLEHASH_API_KEY` | | reserved for a future SimpleHash provider |
| `MONAD_RPC_URL` | ★ | Server-side RPC (can match the public one) — used for receipt/nonce verification |


Collection logos are resolved at runtime from collection contract metadata instead of bundled `/collections/*.png` assets. The lookup order is Reservoir, OpenSea when `OPENSEA_API_KEY` is configured, on-chain `contractURI()`, token metadata via `tokenURI(1)`, then the local `/Logomark.png` placeholder. Results are cached server-side and in React Query to avoid repeated requests on every render.

**Deployment-only (local shell / CI secrets — never needed by the web app)**

| Variable | ★ | Value |
| --- | --- | --- |
| `PRIVATE_KEY_DEPLOYER` | ★ (deploy) | Private key of the funded deployer wallet. Use a fresh wallet; never commit. |
| `FEE_RECIPIENT_ADDRESS` | ★ (deploy) | Wallet that receives protocol fees (ideally a multisig) |
| `CONTRACT_OWNER` | (deploy) | Admin of fee settings; defaults to the deployer if unset. Use a multisig for mainnet. |

### 5. Sanity checks

```bash
npm run typecheck && npm run lint && npm run test   # app: should all pass
npm run contracts:test                              # Foundry suite should pass
forge build                                         # also works from repo root
```

## Architecture

```
┌─────────────┐   sign EIP-712 order    ┌──────────────────┐
│   Maker      │ ──────────────────────► │  Next.js API      │
│  (wallet)    │        (no gas)         │  + Supabase       │
└─────────────┘                          │  (signed orders,  │
                                         │   reputation,     │
┌─────────────┐   browse / accept       │   wanted board)   │
│   Taker      │ ◄────────────────────── └──────────────────┘
│  (wallet)    │
└──────┬──────┘
       │ fulfillTrade(order, signature) + msg.value
       ▼
┌──────────────────────────────┐
│ Handshake.sol     │  EIP-712 verify · nonce/replay ·
│ (Monad, non-custodial)        │  expiry · ownership · approvals ·
└──────────────────────────────┘  atomic NFT+MON transfer · pausable
```

- **Orders are off-chain.** Makers sign EIP-712 `TradeOrder` structs; the signature and order live in Supabase. Creating/listing an offer costs zero gas.
- **Settlement is on-chain and atomic.** The taker calls `fulfillTrade`. The contract verifies the maker's signature, nonce, expiry, designated taker, NFT ownership, and approvals — then moves all NFTs and MON in one transaction. Any failure reverts everything.
- **Maker-side MON** comes from a self-managed escrow on the settlement contract (`deposit`/`withdraw`). The owner can never touch user balances. Taker-side MON is `msg.value`.
- **Status updates are trustless.** The API only marks an offer completed after verifying the `TradeExecuted` event in the tx receipt, and only marks it cancelled after verifying the `TradeCancelled` event for that maker+nonce — so a fill can't be mislabeled as a cancellation.

### Fees

- The fee both parties agree to is **baked into the signed order** (`feeBps`, `flatFee`), so the owner can never change the fee on an already-signed order. Default `feeBps = 100` (1%) on **each MON leg**, hard-capped at `MAX_FEE_BPS = 500` (5%).
- Pure NFT-for-NFT swaps pay **no percentage fee**; an optional `flatFee` (capped at `MAX_FLAT_SWAP_FEE = 1 MON`) can apply so swap-heavy volume still generates revenue.
- Fees use **pull payments**: they accrue to `pendingFees[feeRecipient]` and are claimed via `withdrawFees()`, so a reverting fee recipient can never brick a trade.

## File tree

```
contracts/
  foundry.toml
  src/Handshake.sol                 # settlement contract
  test/                             # Foundry suite (unit + fuzz + invariant + fork)
    HandshakeAllowlist.t.sol        #   allowlist / timelock / lying-collection
    HandshakeSolvency.t.sol         #   fuzzed solvency invariant (EOA payouts)
    HandshakeFallbackSolvency.t.sol #   solvency when every payout hits the escrow fallback
    HandshakeAdversarial.t.sol      #   reentrancy at the NFT callback (both legs), payout griefing
    HandshakeFeeMath.t.sol          #   fuzzed fee accrual + solvency across all inputs
    HandshakeUpgradeableRisk.t.sol  #   upgradeable-collection allowlist theft demo
    HandshakeForkCollections.t.sol  #   fork check of the real seeded collections
    mocks/                          #   MockERC721, LyingERC721, ReentrantTaker/Maker,
                                    #   GasGriefingReceiver, ReturnBomber, RejectingReceiver,
                                    #   MaliciousProxy721
  script/Deploy.s.sol
  lib/forge-std/                    # vendored
app/
  page.tsx                          # homepage: hero, how-it-works, feed, stats
  create/page.tsx                   # trade builder + EIP-712 signing
  offers/[id]/page.tsx              # offer detail, accept / cancel flows
  account/page.tsx                  # my NFTs, offers, history, reputation
  wanted/page.tsx                   # wanted board
  api/
    config/  nfts/  stats/  reputation/  wanted/
    offers/  offers/[id]/  offers/[id]/cancel/  offers/[id]/complete/
components/
  layout/header.tsx  wallet/network-guard.tsx
  trade/{nft-card,offer-card,fee-breakdown}.tsx
  ui/{button,card,input,badge,skeleton}.tsx
lib/
  chains/monad.ts                   # all Monad config (env-driven)
  chains/client.ts                  # server-side viem public client
  orders/eip712.ts                  # order types, hashing, EOA + EIP-1271 verification
  fees.ts                           # fee math (mirrors the contract)
  featured-collections.ts           # curated / seeded collection list
  contracts/settlement.ts           # ABI
  nft/{provider.ts,index.ts,pricing.ts,providers/{alchemy,opensea}.ts}
  supabase/server.ts  db/offers.ts  validation/offers.ts  rate-limit.ts
scripts/
  verify-allowlist.mjs              # post-deploy allowlist verification (read-only)
  verify-contract.mjs               # source verification wrapper
  watch-collections.mjs             # CollectionProposed watcher / alerter (read-only)
supabase/migrations/                # init + order-fee-fields + nft-rarity
tests/                              # vitest: fee math, validation, EIP-712, wanted-auth
docs/
  SECURITY_AUDIT.md                 # adversarial production-readiness audit
  slither-findings.md               # static-analysis triage (signal vs noise)
SECURITY.md                         # disclosure policy + scope
.github/workflows/
  contracts.yml                     # forge build & test (+ nightly seeded-collection fork job)
  collection-watch.yml              # hourly CollectionProposed watcher (opt-in)
```

## Setup

```bash
npm install
cp .env.example .env.local          # fill in values
npm run dev
```

Requirements: Node 20+, [Foundry](https://book.getfoundry.sh/getting-started/installation) for contracts.

### Environment variables

See `.env.example`. Key ones:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CHAIN_ID` | Monad chain id (mainnet `143`) |
| `NEXT_PUBLIC_MONAD_RPC_URL` / `MONAD_RPC_URL` | RPC endpoints (client / server) |
| `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` | Deployed `Handshake` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
| `NFT_PROVIDER` + `ALCHEMY_API_KEY` / `OPENSEA_API_KEY` | NFT indexing (swappable) |
| `PRIVATE_KEY_DEPLOYER`, `FEE_RECIPIENT_ADDRESS`, `CONTRACT_OWNER` | contract deployment only |

### Database

Apply every file in `supabase/migrations/` (in filename order) via the Supabase SQL editor or `supabase db push`. RLS is enabled on all tables; all access goes through the service-role API layer.

### Commands

```bash
npm run dev / build / lint / typecheck
npm run test              # vitest (fee math, validation, EIP-712, wanted-auth)
npm run contracts:test    # foundry suite (unit + fuzz + invariant; fork test self-skips w/o MONAD_RPC_URL)
forge build               # root-level Foundry build; equivalent project settings are in ./foundry.toml
npm run contracts:deploy  # deploy to $MONAD_RPC_URL
npm run verify:allowlist  # read-only: confirm seeded collections are allowlisted post-deploy
npm run watch:collections # watch CollectionProposed (add -- --once for a single cron scan)
```

## Testing

Contracts run on Foundry (compiled with the exact deployed toolchain, solc
`0.8.28`); the app runs on Vitest. Both run in CI on every push
(`.github/workflows/contracts.yml`).

**Contract suite** (`contracts/test/`)

| Suite | What it proves |
| --- | --- |
| `HandshakeAllowlist` | Allowlist gating, the 48h/instant timelock asymmetry, and that a lying-`ownerOf` collection is excluded before it is ever called. |
| `HandshakeSolvency` (invariant) | `balance == Σescrow + ΣpendingFees` holds across arbitrary deposit / settle / propose / remove / warp sequences. |
| `HandshakeFallbackSolvency` (invariant) | Same solvency invariant when **every** payout is forced through the post-interaction escrow-credit fallback. |
| `HandshakeAdversarial` | Reentrancy at the mid-settlement NFT callback on **both** legs (contract taker and EIP-1271 contract maker re-entering `withdraw`/`withdrawFees`) unwinds the trade; gas-griefing and return-bomb payout recipients fall back to a recoverable escrow credit; dual-MON-leg fees exact with off-by-one payments rejected. |
| `HandshakeFeeMath` (fuzz) | Fee accrual is exact and solvency holds for all `makerMon`/`takerMon`/`feeBps` and the flat-fee branch, including the fee caps and the integer-division rounding boundary. |
| `HandshakeUpgradeableRisk` | Executable demo of the one residual risk: an allowlisted **upgradeable** collection can swap in a lying `ownerOf` and enable theft — and that instant `removeCollection` stops it. |
| `HandshakeForkCollections` (fork) | The real seeded Monad collections are non-upgradeable, ERC-721, and transferable. Self-skips without `MONAD_RPC_URL`; runs nightly / on demand. |

Static analysis (Slither) triage is in [`docs/slither-findings.md`](docs/slither-findings.md);
the full adversarial writeup is in [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md).

**App suite** (`tests/`) — Vitest covers fee math, Zod input validation, EIP-712
order hashing/verification, and wanted-board signature auth.

## Deployment

1. **Contracts** — set `MONAD_RPC_URL`, `PRIVATE_KEY_DEPLOYER`, `FEE_RECIPIENT_ADDRESS`, `CONTRACT_OWNER`, then `npm run contracts:deploy`. Record the address.
   - Verify through Monad's Sourcify-compatible verifier (the same BlockVision endpoint is used by MonadVision/MonadScan). Prefer the wrapper script so constructor encoding and line continuations cannot be mangled by the shell:
     ```bash
     export MONAD_RPC_URL=https://rpc.monad.xyz
     export NEXT_PUBLIC_CHAIN_ID=143
     export HANDSHAKE_ADDRESS=0x...                 # deployed Handshake address
     export CONTRACT_OWNER=0x...                    # constructor arg 1
     export FEE_RECIPIENT_ADDRESS=0x...             # constructor arg 2
     export INITIAL_COLLECTIONS=0xabc...,0xdef...   # constructor arg 3, exactly as deployed
     npm run contracts:verify
     ```
   - The verifier URL defaults to `https://sourcify-api-monad.blockvision.org/` (note the trailing slash). If you need Etherscan V2 instead, set `VERIFIER=etherscan` and `ETHERSCAN_API_KEY`; the script will use `https://api.etherscan.io/v2/api?chainid=143`.
   - If running the raw Foundry command manually, keep it as one command with backslashes at the end of every continued line and encode all three constructor arguments: `constructor(address,address,address[])`.
2. **Database** — create a Supabase project, run every migration, copy keys.
3. **Frontend** — deploy to Vercel; set all `NEXT_PUBLIC_*` vars plus `SUPABASE_SERVICE_ROLE_KEY`, `NFT_PROVIDER`, provider API key, `MONAD_RPC_URL`.

### Deployed contracts

| Network | Handshake | Status |
| --- | --- | --- |
| Monad Mainnet (143) | [`0x72F3E21c12E85F2043e316737179734b30c87533`](https://monadscan.com/address/0x72F3E21c12E85F2043e316737179734b30c87533#code) | ✅ Verified on MonadScan (EIP-1271 smart-wallet support) |

Previous deployment `0xA9E7f8D08ecd275D9Dd7C95cF9a557B8bce4a277` (EOA-only) is
superseded by the address above, which additionally accepts EIP-1271
signatures from smart-contract wallets.

Source is verified (Solidity `0.8.28`, optimizer 1000 runs, EVM `cancun`, MIT)
— anyone can read and verify the settlement logic on MonadScan. This is the
build with order-bound fees, the flat-fee cap, pull-payment fees, and the
`Pausable` emergency stop. `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` should be
set to this address.

### Ownership & allowlist monitoring

The owner's only power is fee config and the allowlist — it can never move user
NFTs or escrow. Two operational steps harden what remains:

1. **Move ownership to a multisig.** `Handshake` is `Ownable2Step`, so it's a
   two-step handoff (a typo can't brick admin):
   ```bash
   # from the current owner key:
   cast send <HANDSHAKE> "transferOwnership(address)" <SAFE> \
     --rpc-url https://rpc.monad.xyz --interactive
   # then, from the Safe: execute acceptOwnership() on <HANDSHAKE>
   cast call <HANDSHAKE> "owner()(address)" --rpc-url https://rpc.monad.xyz  # == <SAFE>
   ```
2. **Watch `CollectionProposed`.** Adding a collection is timelocked by
   `ADD_DELAY` (48h); removal is instant. The delay is only a real defense if a
   proposal is noticed during the window. `scripts/watch-collections.mjs` tails
   the event, flags unexpected or upgradeable-proxy collections, and (optionally)
   webhooks an alert. Run it yourself, or enable the hourly
   `collection-watch.yml` workflow: set repo variable
   `WATCH_COLLECTIONS_ENABLED=true` and secrets `MONAD_RPC_URL`,
   `HANDSHAKE_ADDRESS`, and optional `ALERT_WEBHOOK_URL`.

### Production checklist

- [x] Contract deployed on Monad mainnet and source-verified on MonadScan
- [ ] Contract owner moved to a multisig — `transferOwnership` + `acceptOwnership` (currently a single EOA)
- [ ] Every seeded collection confirmed non-upgradeable (run the `HandshakeForkCollections` fork test with `MONAD_RPC_URL` set)
- [ ] Allowlist watcher running — `collection-watch.yml` enabled or `npm run watch:collections` hosted
- [ ] `feeBps` confirmed (default 100), `flatFee` decided
- [ ] `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` set everywhere to `0x72F3…7533`
- [ ] Supabase migrations applied, RLS verified, service key only on server
- [ ] WalletConnect project id set
- [ ] NFT provider key set and Monad mainnet slug confirmed
- [x] Distributed rate limiting available (set `UPSTASH_REDIS_REST_URL`/`_TOKEN`)
- [ ] Independent external smart-contract audit

## Security review

Vulnerability disclosure policy: [`SECURITY.md`](SECURITY.md). Detailed writeups:
[`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md) (adversarial audit) and
[`docs/slither-findings.md`](docs/slither-findings.md) (static analysis). No
independent external audit has been performed yet.

**Contract.** EIP-712 signatures (EOA + EIP-1271 smart wallets) bound to chain id + verifying contract; **fees (bps + flat) are baked into the signed order** so they can't change after signing, capped by `MAX_FEE_BPS`/`MAX_FLAT_SWAP_FEE`; per-maker nonce map prevents replay and powers on-chain cancellation; expiry enforced; designated-taker enforcement; ownership *and* approval verified before any transfer, plus a **post-transfer effectiveness check**; **collection allowlist** with an asymmetric timelock (48h add, instant remove) that excludes a lying `ownerOf` collection before it is ever called; checks-effects-interactions with `nonReentrant`; MON proceeds auto-withdrawn with a bounded gas stipend that **falls back to a pull-payment escrow credit** so a hostile recipient can't grief/OOG settlement; **protocol fees use pull payments** (`withdrawFees`); **`Pausable`** emergency stop on settlement (escrow/fee withdrawal and cancellation stay open); custom errors throughout; `Ownable2Step` admin limited to fee config + allowlist — **no admin path can move user NFTs or escrow.**

**Test coverage.** The Foundry suite exercises the happy path, replay, fees, pause and the allowlist timelock, plus: reentrancy at the mid-settlement NFT callback on **both** legs (contract taker and EIP-1271 contract maker re-entering `withdraw`/`withdrawFees`), the `_payout` escrow-credit fallback under gas-griefing and return-bomb recipients, fuzzed **solvency** and **fee-math** invariants (incl. the fee caps and rounding boundary), an executable **upgradeable-collection** theft demo, and a **fork test** asserting the real seeded collections are non-upgradeable and transferable.

**Backend.** No private keys, no backend signing, no custody. All inputs validated with Zod. Maker signatures re-verified server-side before storing orders — **on-chain `verifyTypedData` so both EOA (ECDSA) and EIP-1271 (Safe / smart-wallet) makers are accepted**, matching the contract. The complete and cancel endpoints each verify the specific on-chain event in the submitted receipt (`TradeExecuted` / `TradeCancelled` for this maker+nonce) rather than trusting the client or a bare `nonceUsed` flag — so a fill can't be mislabeled as a cancellation. Per-IP rate limits on mutating routes (distributed via Upstash Redis when configured, in-memory otherwise). Wanted-board posts/deletes require an EIP-191 wallet signature so nobody can post or remove on another address's behalf. Supabase RLS is enabled on every table with no anon policies (service-role-only). Private offers excluded from public feeds.

**Known limitations.**
- ERC-721 only (no ERC-1155 yet); `quantity` column is forward-compatible.
- Maker-side MON requires an escrow deposit (native tokens can't be pulled by signature). A WMON + permit path would remove this step.
- Rate limiter uses Upstash Redis when `UPSTASH_REDIS_REST_*` are set; otherwise falls back to a per-instance in-memory window (fine for single-instance/dev).
- Off-chain order book means a cancelled-in-DB-only offer would still be technically fillable — which is why cancellation is on-chain (`cancelNonce`) and the UI enforces it.
- The maker's NFT approvals must be in place before a taker accepts; the offer page surfaces approval failures from the contract but a pre-flight maker approval step in `/create` would be smoother UX.
- **Allowlist trust assumption.** The lying-`ownerOf` defense assumes every allowlisted collection is honest *and immutable*. An **upgradeable** (proxy) collection could swap in a malicious `ownerOf` after being allowlisted, reopening the theft vector — so only non-upgradeable, standard ERC-721s should be allowlisted. The `HandshakeForkCollections` fork test and the `watch-collections` script exist to catch this; `removeCollection` is instant if one is found.
- The contract owner is currently a single EOA — move it to a multisig (`Ownable2Step`; see *Ownership & allowlist monitoring*) before treating this as production-grade.

## Roadmap

- Collection-wide and trait-based offers (signed with merkle criteria)
- Counter-offers and negotiation threads
- ERC-1155 support
- WMON permit flow to remove maker escrow step
- SIWE authentication, Discord linking, reputation badges & leaderboard
- Indexer service consuming `TradeExecuted`/`TradeCancelled` events for fully event-driven status updates
- Trade history analytics and referral system
