# Monad Market

A peer-to-peer NFT trading marketplace for the Monad ecosystem. Users negotiate and exchange NFTs directly wallet-to-wallet — NFT-for-NFT, NFT+MON, MON-for-NFT, private wallet-targeted offers — settled atomically by a non-custodial smart contract.

It's a trading desk, not a sniping ground: off-chain signed orders (free to create), offer expirations, private offers, wallet reputation, and no instant floor-sniping mechanics.

## Requirements

### Functional requirements

**Trade offers**
- FR-1: A user can connect a wallet (RainbowKit/wagmi) and browse their owned ERC-721 NFTs on Monad.
- FR-2: A user (maker) can create a trade offer composed of any combination of: NFTs offered, MON offered, NFTs requested, MON requested. At least one asset must exist on each side; max 20 NFTs per side.
- FR-3: Offers may optionally target a specific taker wallet; private offers (hidden from public feeds, visible only via direct link / to the parties) require a taker address.
- FR-4: Every offer has a mandatory expiration timestamp chosen by the maker (1h / 24h / 7d / 30d in the UI; any future timestamp in the order model).
- FR-5: Offer creation is **gasless**: the maker signs an EIP-712 `TradeOrder`; the signed order is stored off-chain in Supabase. Only settlement and cancellation touch the chain.
- FR-6: Any eligible counterparty (the designated taker, or anyone for open offers) can accept an offer; acceptance settles the trade atomically on-chain via `fulfillTrade`.
- FR-7: A maker can cancel an open offer at any time. Cancellation is an on-chain action (`cancelNonce`) so the signature can never be replayed; the API only marks an offer cancelled after reading `nonceUsed` on-chain.
- FR-8: An offer is marked completed only after the API verifies a successful transaction receipt containing a `TradeExecuted` event with the offer's order hash from the settlement contract.
- FR-9: Statuses: `open → completed | cancelled | expired`. Expired offers are unfillable on-chain by construction.

**Marketplace & social**
- FR-10: Homepage shows hero, how-it-works, open-offer feed, recent completed trades, and aggregate stats (trades settled, open offers, MON volume).
- FR-11: Offer detail page shows both sides of the trade, fee breakdown, accept/cancel actions, and explorer links for settlement/cancellation transactions.
- FR-12: Account page shows the connected wallet's NFTs, open/completed/cancelled offers, and reputation (completed count, cancelled count, last trade).
- FR-13: Wanted board lets any connected wallet post "looking for X / offering Y" requests.

**Fees (business model)**
- FR-14: Protocol fee of `feeBps` (default 100 = 1%, hard cap 500 = 5%) is charged on **each MON leg** of a trade; NFT-only swaps pay no percentage fee.
- FR-15: An owner-configurable `flatSwapFee` (default 0) may be charged on pure NFT↔NFT swaps so swap-only volume can still generate revenue.
- FR-16: Fees transfer atomically to a configurable `feeRecipient`; if the fee transfer fails the entire trade reverts. Owner may update `feeRecipient`, `feeBps`, and `flatSwapFee` — nothing else.
- FR-17: The UI shows the exact fee breakdown (per-leg fee, flat fee, taker total, maker escrow requirement) before signing and before accepting.

**Chain**
- FR-18: The app targets Monad (testnet `10143` by default) and is mainnet-ready: chain id, RPC URLs, and explorer URLs are environment-driven (`lib/chains/monad.ts`); nothing is hardcoded to Ethereum.
- FR-19: When the connected wallet is on the wrong network, a persistent banner prompts a one-click switch to Monad; settlement actions are blocked until the network matches.
- FR-20: All values display in MON (18 decimals).

### Smart contract requirements

- SC-1: `MonadMarketSettlement.sol` verifies, in order: order non-emptiness and size bounds, expiry, designated taker, no self-trade, nonce unused, EIP-712 signature recovers to the maker, exact taker payment (`takerMonAmount + takerLegFee + flatFee`), sufficient maker escrow, and NFT ownership **and** approval for every item on both sides — before any state change or transfer.
- SC-2: Settlement follows checks-effects-interactions and is `nonReentrant`; the nonce is consumed and escrow debited before external calls.
- SC-3: All transfers (NFTs both directions, MON both directions, protocol fee) happen in one transaction; any failure reverts everything.
- SC-4: Replay protection: per-maker `nonceUsed` mapping; a filled or cancelled nonce can never be reused. Signatures are bound to chain id and contract address via the EIP-712 domain.
- SC-5: Maker-side MON is funded from a self-managed escrow (`deposit`/`withdraw`). The owner has **no** path to move user NFTs or escrow balances; admin surface is fee configuration only (`Ownable2Step`).
- SC-6: Events: `TradeExecuted`, `TradeCancelled`, `FeeRecipientUpdated`, `FeeBpsUpdated`, `FlatSwapFeeUpdated`, `EscrowDeposited`, `EscrowWithdrawn`. Custom errors everywhere (no string reverts).
- SC-7: Forbidden by design: private key storage, backend signing, custodial wallets, admin-controlled asset movement.

### Backend / API requirements

- API-1: Endpoints: `GET /api/config`, `GET /api/nfts`, `GET/POST /api/offers`, `GET /api/offers/[id]`, `POST /api/offers/[id]/cancel`, `POST /api/offers/[id]/complete`, `GET /api/stats`, `GET /api/reputation`, `GET/POST /api/wanted`.
- API-2: Every input is validated with Zod; the backend never trusts the frontend. Maker signatures are re-verified server-side before an order is stored; the server recomputes the order hash.
- API-3: Status transitions are verified against the chain (receipt events for complete, `nonceUsed` for cancel) — the client cannot forge them.
- API-4: Mutating routes are rate-limited per IP (offers 10/min, cancel/complete 20/min, wanted 5/min, NFT reads 30/min).
- API-5: NFT indexing goes through the `NFTProvider` interface (`getWalletNFTs`, `getCollection`, `getToken`, `searchCollection`); the concrete provider (Alchemy default, Reservoir included) is selected by `NFT_PROVIDER` with no provider logic leaking elsewhere.

### Data requirements

- DB-1: Supabase PostgreSQL with migrations under `supabase/migrations/`. Tables: `profiles`, `trade_offers`, `trade_offer_nfts`, `trade_events`, `wallet_reputation`, `wanted_posts`.
- DB-2: Addresses stored lowercase (enforced by CHECK constraints); `order_hash` unique; `(chain_id, maker_address, nonce)` unique; MON amounts stored as `numeric(78,0)` wei strings.
- DB-3: Row-level security enabled on all tables; all access flows through the service-role API layer. Every offer lifecycle change is appended to `trade_events`.

### Non-functional requirements

- NFR-1: `npm install`, `npm run dev|build|lint|typecheck|test`, and `npm run contracts:test|contracts:deploy` must all work.
- NFR-2: Test coverage: Foundry suite (settlement success for all four trade shapes, bad signature, wrong taker, expiry, cancelled nonce, replay, fee math incl. fuzz, fee-transfer atomicity, ownership/approval failures, escrow) plus Vitest suites for fee math parity, API validation, and EIP-712 hashing/signature verification.
- NFR-3: UI: dark-mode-first, responsive/mobile-friendly, skeleton loading, empty states, error states, toast notifications.
- NFR-4: Anti-bot posture: no instant buy/floor-sniping mechanic, private and wallet-targeted offers, mandatory expiry, wallet reputation, API rate limiting.
- NFR-5: TypeScript strict mode; Solidity 0.8.28 with optimizer; no secrets in the repo (`.env.example` only).


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
└──────────────────────────────┘  atomic NFT+MON transfer · 1% fee
```

- **Orders are off-chain.** Makers sign EIP-712 `TradeOrder` structs; the signature and order live in Supabase. Creating/listing an offer costs zero gas.
- **Settlement is on-chain and atomic.** The taker calls `fulfillTrade`. The contract verifies the maker's signature, nonce, expiry, designated taker, NFT ownership, and approvals — then moves all NFTs and MON in one transaction. Any failure reverts everything.
- **Maker-side MON** comes from a self-managed escrow on the settlement contract (`deposit`/`withdraw`). The owner can never touch user balances. Taker-side MON is `msg.value`.
- **Status updates are trustless.** The API only marks an offer completed after verifying the `TradeExecuted` event in the tx receipt, and only marks it cancelled after reading `nonceUsed` on-chain.

### Fees

- `feeBps = 100` (1%) on **each MON leg**, capped at `MAX_FEE_BPS = 500`.
- Pure NFT-for-NFT swaps pay **no percentage fee**; the owner may set an optional `flatSwapFee` (e.g. 0.05 MON) so swap-heavy volume still generates revenue.
- Fees transfer atomically to the configurable `feeRecipient`; the trade reverts if the fee transfer fails.

## File tree

```
contracts/
  foundry.toml
  src/MonadMarketSettlement.sol     # settlement contract
  test/MonadMarketSettlement.t.sol  # 26 Foundry tests (success, replay, fees, ...)
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
| `NEXT_PUBLIC_CHAIN_ID` | Monad chain id (testnet `10143`) |
| `NEXT_PUBLIC_MONAD_RPC_URL` / `MONAD_RPC_URL` | RPC endpoints (client / server) |
| `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` | Deployed `MonadMarketSettlement` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
| `NFT_PROVIDER` + `ALCHEMY_API_KEY` / `RESERVOIR_API_KEY` | NFT indexing (swappable) |
| `PRIVATE_KEY_DEPLOYER`, `FEE_RECIPIENT_ADDRESS`, `CONTRACT_OWNER` | contract deployment only |

### Database

Apply `supabase/migrations/20260610000000_init.sql` via the Supabase SQL editor or `supabase db push`. RLS is enabled on all tables; all access goes through the service-role API layer.

### Commands

```bash
npm run dev / build / lint / typecheck
npm run test              # vitest (fee math, validation, EIP-712)
npm run contracts:test    # foundry test suite
npm run contracts:deploy  # deploy to $MONAD_RPC_URL
```

## Deployment

1. **Contracts** — set `MONAD_RPC_URL`, `PRIVATE_KEY_DEPLOYER`, `FEE_RECIPIENT_ADDRESS`, `CONTRACT_OWNER`, then `npm run contracts:deploy`. Record the address.
   - Verify (if a Sourcify/Etherscan-compatible verifier is available):
     `forge verify-contract --root contracts <ADDRESS> src/MonadMarketSettlement.sol:MonadMarketSettlement --chain-id 10143 --constructor-args $(cast abi-encode "constructor(address,address)" $CONTRACT_OWNER $FEE_RECIPIENT_ADDRESS)`
2. **Database** — create a Supabase project, run the migration, copy keys.
3. **Frontend** — deploy to Vercel; set all `NEXT_PUBLIC_*` vars plus `SUPABASE_SERVICE_ROLE_KEY`, `NFT_PROVIDER`, provider API key, `MONAD_RPC_URL`.

Contract addresses (fill in after deployment):

| Network | MonadMarketSettlement |
| --- | --- |
| Monad Testnet (10143) | `0x_________________` |
| Monad Mainnet | `0x_________________` |

### Production checklist

- [ ] Contract deployed, owner is a multisig, fee recipient set
- [ ] `feeBps` confirmed (default 100), `flatSwapFee` decided
- [ ] `NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS` set everywhere
- [ ] Supabase migration applied, RLS verified, service key only on server
- [ ] WalletConnect project id set
- [ ] NFT provider key set and Monad network slug confirmed
- [ ] Rate limiting backed by Redis/Upstash if running multiple instances
- [ ] External smart-contract audit before mainnet

## Security review

**Contract.** EIP-712 signatures bound to chain id + verifying contract; per-maker nonce map prevents replay and powers on-chain cancellation; expiry enforced; designated-taker enforcement; ownership *and* approval verified before any transfer; checks-effects-interactions with `nonReentrant`; fee transfer failure reverts the whole trade; custom errors throughout; `Ownable2Step` admin limited to fee config — **no admin path can move user NFTs or escrow.**

**Backend.** No private keys, no backend signing, no custody. All inputs validated with Zod. Maker signatures re-verified server-side before storing orders. Complete/cancel endpoints verify on-chain state (receipt event / `nonceUsed`) instead of trusting the client. Per-IP rate limits on mutating routes. Private offers excluded from public feeds.

**Known limitations.**
- ERC-721 only (no ERC-1155 yet); `quantity` column is forward-compatible.
- Maker-side MON requires an escrow deposit (native tokens can't be pulled by signature). A WMON + permit path would remove this step.
- In-memory rate limiter is per-instance; swap for Redis in multi-instance deployments.
- Off-chain order book means a cancelled-in-DB-only offer would still be technically fillable — which is why cancellation is on-chain (`cancelNonce`) and the UI enforces it.
- The maker's NFT approvals must be in place before a taker accepts; the offer page surfaces approval failures from the contract but a pre-flight maker approval step in `/create` would be smoother UX.
- No SIWE auth yet — the wanted board trusts the claimed wallet address (low stakes; offers themselves are signature-verified).

## Roadmap

- Collection-wide and trait-based offers (signed with merkle criteria)
- Counter-offers and negotiation threads
- ERC-1155 support
- WMON permit flow to remove maker escrow step
- SIWE authentication, Discord linking, reputation badges & leaderboard
- Indexer service consuming `TradeExecuted`/`TradeCancelled` events for fully event-driven status updates
- Trade history analytics and referral system
