# Handshake

A peer-to-peer NFT trading marketplace for the Monad ecosystem — no bots, no snipers. Users negotiate and exchange NFTs directly wallet-to-wallet — NFT-for-NFT, NFT+MON, MON-for-NFT, private wallet-targeted offers — settled atomically by a non-custodial smart contract.

> The on-chain settlement contract keeps its original name (`MonadMarketSettlement`) and EIP-712 domain (`MonadMarket`) — these are baked into the deployed bytecode and every signature, so they must not be renamed. "Handshake" is the product brand only.

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
| *or* **Reservoir** (reservoir.tools) | An API key | alternative NFT provider (`NFT_PROVIDER=reservoir`) | free tier |
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
| `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` | ★ | `0xA9E7f8D08ecd275D9Dd7C95cF9a557B8bce4a277` (see [Deployed contracts](#deployed-contracts)) |
| `NEXT_PUBLIC_SUPABASE_URL` | ★ | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ★ | Supabase → Project Settings → API |

**Server-only (never expose; set in Vercel as plain env vars)**

| Variable | ★ | Value / where to get it |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | ★ | Supabase → Project Settings → API (service_role). Bypasses RLS — server only. |
| `NFT_PROVIDER` | ★ | `alchemy` (default) or `reservoir` |
| `ALCHEMY_API_KEY` | ★ (if alchemy) | Alchemy dashboard → app → API key |
| `RESERVOIR_API_KEY` | (if reservoir) | Reservoir dashboard |
| `SIMPLEHASH_API_KEY` | | reserved for a future SimpleHash provider |
| `MONAD_RPC_URL` | ★ | Server-side RPC (can match the public one) — used for receipt/nonce verification |

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
│ MonadMarketSettlement.sol     │  EIP-712 verify · nonce/replay ·
│ (Monad, non-custodial)        │  expiry · ownership · approvals ·
└──────────────────────────────┘  atomic NFT+MON transfer · pausable
```

- **Orders are off-chain.** Makers sign EIP-712 `TradeOrder` structs; the signature and order live in Supabase. Creating/listing an offer costs zero gas.
- **Settlement is on-chain and atomic.** The taker calls `fulfillTrade`. The contract verifies the maker's signature, nonce, expiry, designated taker, NFT ownership, and approvals — then moves all NFTs and MON in one transaction. Any failure reverts everything.
- **Maker-side MON** comes from a self-managed escrow on the settlement contract (`deposit`/`withdraw`). The owner can never touch user balances. Taker-side MON is `msg.value`.
- **Status updates are trustless.** The API only marks an offer completed after verifying the `TradeExecuted` event in the tx receipt, and only marks it cancelled after reading `nonceUsed` on-chain.

### Fees

- The fee both parties agree to is **baked into the signed order** (`feeBps`, `flatFee`), so the owner can never change the fee on an already-signed order. Default `feeBps = 100` (1%) on **each MON leg**, hard-capped at `MAX_FEE_BPS = 500` (5%).
- Pure NFT-for-NFT swaps pay **no percentage fee**; an optional `flatFee` (capped at `MAX_FLAT_SWAP_FEE = 1 MON`) can apply so swap-heavy volume still generates revenue.
- Fees use **pull payments**: they accrue to `pendingFees[feeRecipient]` and are claimed via `withdrawFees()`, so a reverting fee recipient can never brick a trade.

## File tree

```
contracts/
  foundry.toml
  src/MonadMarketSettlement.sol     # settlement contract
  test/MonadMarketSettlement.t.sol  # Foundry tests (success, replay, fees, pause, ...)
  test/mocks/MockERC721.sol
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
  orders/eip712.ts                  # order types, hashing, verification
  fees.ts                           # fee math (mirrors the contract)
  contracts/settlement.ts           # ABI
  nft/{provider.ts,index.ts,providers/{alchemy,reservoir}.ts}
  supabase/server.ts  db/offers.ts  validation/offers.ts  rate-limit.ts
supabase/migrations/20260610000000_init.sql
tests/                              # vitest: fee math, validation, EIP-712
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
| `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` | Deployed `MonadMarketSettlement` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
| `NFT_PROVIDER` + `ALCHEMY_API_KEY` / `RESERVOIR_API_KEY` | NFT indexing (swappable) |
| `PRIVATE_KEY_DEPLOYER`, `FEE_RECIPIENT_ADDRESS`, `CONTRACT_OWNER` | contract deployment only |

### Database

Apply every file in `supabase/migrations/` (in filename order) via the Supabase SQL editor or `supabase db push`. RLS is enabled on all tables; all access goes through the service-role API layer.

### Commands

```bash
npm run dev / build / lint / typecheck
npm run test              # vitest (fee math, validation, EIP-712)
npm run contracts:test    # foundry test suite
npm run contracts:deploy  # deploy to $MONAD_RPC_URL
```

## Deployment

1. **Contracts** — set `MONAD_RPC_URL`, `PRIVATE_KEY_DEPLOYER`, `FEE_RECIPIENT_ADDRESS`, `CONTRACT_OWNER`, then `npm run contracts:deploy`. Record the address.
   - Verify via Etherscan's V2 multichain API (MonadScan is served through it):
     ```bash
     forge verify-contract <ADDRESS> src/MonadMarketSettlement.sol:MonadMarketSettlement \
       --chain 143 --compiler-version 0.8.28 --num-of-optimizations 1000 --evm-version cancun \
       --constructor-args $(cast abi-encode "constructor(address,address)" $CONTRACT_OWNER $FEE_RECIPIENT_ADDRESS) \
       --verifier etherscan --verifier-url 'https://api.etherscan.io/v2/api?chainid=143' \
       --etherscan-api-key $ETHERSCAN_API_KEY --watch
     ```
2. **Database** — create a Supabase project, run every migration, copy keys.
3. **Frontend** — deploy to Vercel; set all `NEXT_PUBLIC_*` vars plus `SUPABASE_SERVICE_ROLE_KEY`, `NFT_PROVIDER`, provider API key, `MONAD_RPC_URL`.

### Deployed contracts

| Network | MonadMarketSettlement | Status |
| --- | --- | --- |
| Monad Mainnet (143) | [`0xA9E7f8D08ecd275D9Dd7C95cF9a557B8bce4a277`](https://monadscan.com/address/0xA9E7f8D08ecd275D9Dd7C95cF9a557B8bce4a277#code) | ✅ Verified on MonadScan |

Source is verified (Solidity `0.8.28`, optimizer 1000 runs, EVM `cancun`, MIT)
— anyone can read and verify the settlement logic on MonadScan. This is the
build with order-bound fees, the flat-fee cap, pull-payment fees, and the
`Pausable` emergency stop. `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` should be
set to this address.

### Production checklist

- [x] Contract deployed on Monad mainnet and source-verified on MonadScan
- [ ] Contract owner moved to a multisig (currently a single EOA)
- [ ] `feeBps` confirmed (default 100), `flatFee` decided
- [ ] `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` set everywhere to `0xA9E7…a277`
- [ ] Supabase migrations applied, RLS verified, service key only on server
- [ ] WalletConnect project id set
- [ ] NFT provider key set and Monad mainnet slug confirmed
- [x] Distributed rate limiting available (set `UPSTASH_REDIS_REST_URL`/`_TOKEN`)
- [ ] Independent external smart-contract audit

## Security review

**Contract.** EIP-712 signatures bound to chain id + verifying contract; **fees (bps + flat) are baked into the signed order** so they can't change after signing, capped by `MAX_FEE_BPS`/`MAX_FLAT_SWAP_FEE`; per-maker nonce map prevents replay and powers on-chain cancellation; expiry enforced; designated-taker enforcement; ownership *and* approval verified before any transfer; checks-effects-interactions with `nonReentrant`; **protocol fees use pull payments** (`withdrawFees`) so a reverting fee recipient can't brick trades; **`Pausable`** emergency stop on settlement (escrow/fee withdrawal and cancellation stay open); custom errors throughout; `Ownable2Step` admin limited to fee config — **no admin path can move user NFTs or escrow.**

**Backend.** No private keys, no backend signing, no custody. All inputs validated with Zod. Maker signatures re-verified server-side before storing orders. Complete/cancel endpoints verify on-chain state (receipt event / `nonceUsed`) instead of trusting the client. Per-IP rate limits on mutating routes (distributed via Upstash Redis when configured, in-memory otherwise). Wanted-board posts/deletes require an EIP-191 wallet signature so nobody can post or remove on another address's behalf. Private offers excluded from public feeds.

**Known limitations.**
- ERC-721 only (no ERC-1155 yet); `quantity` column is forward-compatible.
- Maker-side MON requires an escrow deposit (native tokens can't be pulled by signature). A WMON + permit path would remove this step.
- Rate limiter uses Upstash Redis when `UPSTASH_REDIS_REST_*` are set; otherwise falls back to a per-instance in-memory window (fine for single-instance/dev).
- Off-chain order book means a cancelled-in-DB-only offer would still be technically fillable — which is why cancellation is on-chain (`cancelNonce`) and the UI enforces it.
- The maker's NFT approvals must be in place before a taker accepts; the offer page surfaces approval failures from the contract but a pre-flight maker approval step in `/create` would be smoother UX.
- The contract owner is currently a single EOA — move it to a multisig (`Ownable2Step`) before treating this as production-grade.

## Roadmap

- Collection-wide and trait-based offers (signed with merkle criteria)
- Counter-offers and negotiation threads
- ERC-1155 support
- WMON permit flow to remove maker escrow step
- SIWE authentication, Discord linking, reputation badges & leaderboard
- Indexer service consuming `TradeExecuted`/`TradeCancelled` events for fully event-driven status updates
- Trade history analytics and referral system
