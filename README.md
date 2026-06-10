# Monad Market

A peer-to-peer NFT trading marketplace for the Monad ecosystem. Users negotiate and exchange NFTs directly wallet-to-wallet — NFT-for-NFT, NFT+MON, MON-for-NFT, private wallet-targeted offers — settled atomically by a non-custodial smart contract.

It's a trading desk, not a sniping ground: off-chain signed orders (free to create), offer expirations, private offers, wallet reputation, and no instant floor-sniping mechanics.

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
