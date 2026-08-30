#!/usr/bin/env node
/*
 * NFT mint sniper — polls a mint contract every second and fires a mint
 * transaction the instant the public sale goes live.
 *
 * IMPORTANT — what "scan OpenSea for minting" actually means:
 *   Minting is an ON-CHAIN action: it is a write call to the collection's own
 *   contract (mint / publicMint / claim / mintPublic …), NOT an OpenSea API
 *   call. OpenSea's API only exposes listings, offers and metadata — it cannot
 *   mint for you. So this script talks directly to the chain's RPC and to the
 *   contract you linked. Your OPENSEA_API_KEY is only used (optionally) to look
 *   up the collection's floor/last price so you can sanity-check the mint price
 *   before you commit funds; it is never in the hot path of the mint itself.
 *
 * How it works (default "auto-detect" mode):
 *   Once per second it dry-runs (eth_call / simulate) your exact mint call,
 *   with your value, from your address. While the sale is closed the call
 *   reverts (NotActive / SaleNotStarted / …). The FIRST second it stops
 *   reverting, the mint is live for you — the script sends the real signed
 *   transaction once, waits for the receipt, prints the explorer link, and
 *   exits. This needs no knowledge of the contract's status-flag name.
 *   If you know the read flag (e.g. saleIsActive()), set MINT_STATUS_FN and it
 *   is checked first as a cheap gate before the simulate.
 *
 * SAFETY
 *   - The wallet private key is read ONLY from env (MINT_PRIVATE_KEY). It is
 *     never logged, never written to disk, never sent anywhere but as a local
 *     transaction signature. Put it in a .env that is git-ignored. Prefer a
 *     fresh "hot" wallet funded with just enough for this mint + gas.
 *   - Nothing is broadcast until a dry-run of your own call succeeds, so the
 *     script will not burn gas on a guaranteed-revert. It sends exactly ONCE.
 *   - Start with MINT_DRY_RUN=1 to watch the gate open without spending.
 *
 * Usage:
 *   cp .env.example .env   # then fill the MINT_* values (see that file)
 *   node scripts/mint-sniper.mjs            # arm and watch (sends when live)
 *   MINT_DRY_RUN=1 node scripts/mint-sniper.mjs   # never sends, just reports
 *   # or: npm run mint:sniper
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  isAddress,
  parseAbiItem,
  parseEther,
  parseGwei,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// --------------------------------------------------------------------------
// Config (all via env — nothing sensitive is ever hard-coded)
// --------------------------------------------------------------------------

const RPC = req("MINT_RPC_URL"); // e.g. Robinhood Chain RPC
const CHAIN_ID = Number(req("MINT_CHAIN_ID"));
const CONTRACT = req("MINT_CONTRACT"); // the NFT contract you linked
const PRIVATE_KEY = req("MINT_PRIVATE_KEY"); // 0x-prefixed; keep it secret

// The write function exactly as shown on the explorer's "Write Contract" tab.
// Examples:
//   "function mint(uint256 quantity) payable"
//   "function publicMint(uint256 quantity) payable"
//   "function mint(address to, uint256 quantity) payable"
//   "function claim(address to, uint256 qty) payable"
const MINT_SIG =
  process.env.MINT_FUNCTION ?? "function mint(uint256 quantity) payable";

// How many to mint, and where they go (defaults to your own wallet).
const QUANTITY = BigInt(process.env.MINT_QUANTITY ?? "1");
const MINT_TO = process.env.MINT_TO ? getAddress(process.env.MINT_TO) : null;

// TOTAL value to send with the call (price-per-unit * quantity). Set the
// number you see as the mint price. Empty / 0 => free mint.
const PRICE_PER_UNIT_ETH = process.env.MINT_PRICE_ETH ?? "0";
const TOTAL_VALUE =
  parseEther(String(PRICE_PER_UNIT_ETH)) * QUANTITY; // wei

// Optional cheap gate: a view fn that returns true when the sale is open.
// e.g. "function saleIsActive() view returns (bool)". Checked before the
// simulate; if it reverts or is unset we fall back to the simulate probe.
const STATUS_SIG = process.env.MINT_STATUS_FN ?? "";

// Poll cadence. You asked for every second.
const POLL_MS = Number(process.env.MINT_POLL_MS ?? 1000);

// Gas. If unset, viem/RPC estimate is used. Set caps for a competitive mint.
const GAS_LIMIT = process.env.MINT_GAS_LIMIT ? BigInt(process.env.MINT_GAS_LIMIT) : undefined;
const MAX_FEE_GWEI = process.env.MINT_MAX_FEE_GWEI ?? "";
const PRIORITY_GWEI = process.env.MINT_PRIORITY_GWEI ?? "";

const DRY_RUN = ["1", "true", "yes"].includes((process.env.MINT_DRY_RUN ?? "").toLowerCase());
const MAX_ATTEMPTS = Number(process.env.MINT_MAX_ATTEMPTS ?? "0"); // 0 = forever until live

function req(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env ${name}. See .env.example (MINT_* block).`);
    process.exit(2);
  }
  return v;
}

if (!isAddress(CONTRACT)) {
  console.error(`MINT_CONTRACT is not a valid address: ${CONTRACT}`);
  process.exit(2);
}
if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
  console.error("MINT_PRIVATE_KEY must be a 0x-prefixed 32-byte hex private key.");
  process.exit(2);
}

const address = getAddress(CONTRACT);
const mintAbi = parseAbiItem(MINT_SIG);
const statusAbi = STATUS_SIG ? parseAbiItem(STATUS_SIG) : null;

// Build the argument list for the mint call from the function's declared
// inputs. Supports the common shapes: (quantity), (to, quantity),
// (quantity, to). Anything more exotic: set MINT_ARGS as a JSON array, where
// the strings "{to}" and "{quantity}" are substituted.
const account = privateKeyToAccount(PRIVATE_KEY);
const recipient = MINT_TO ?? account.address;

function buildArgs() {
  if (process.env.MINT_ARGS) {
    const raw = JSON.parse(process.env.MINT_ARGS);
    return raw.map((a) => {
      if (a === "{to}") return recipient;
      if (a === "{quantity}") return QUANTITY;
      return typeof a === "number" ? BigInt(a) : a;
    });
  }
  const inputs = mintAbi.inputs ?? [];
  return inputs.map((inp) => {
    if (inp.type === "address") return recipient;
    if (inp.type.startsWith("uint") || inp.type.startsWith("int")) return QUANTITY;
    if (inp.type === "bool") return true;
    throw new Error(
      `Cannot auto-fill mint arg "${inp.name}:${inp.type}". Set MINT_ARGS as a JSON array ` +
        `(use "{to}" and "{quantity}" placeholders).`
    );
  });
}
const args = buildArgs();

// --------------------------------------------------------------------------
// Clients
// --------------------------------------------------------------------------

const chain = {
  id: CHAIN_ID,
  name: process.env.MINT_CHAIN_NAME ?? `chain-${CHAIN_ID}`,
  nativeCurrency: { name: "Ether", symbol: process.env.MINT_CURRENCY_SYMBOL ?? "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
};
const EXPLORER = (process.env.MINT_EXPLORER_URL ?? "").replace(/\/$/, "");

const publicClient = createPublicClient({ chain, transport: http(RPC) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC) });

const feeOverrides = {};
if (MAX_FEE_GWEI) feeOverrides.maxFeePerGas = parseGwei(String(MAX_FEE_GWEI));
if (PRIORITY_GWEI) feeOverrides.maxPriorityFeePerGas = parseGwei(String(PRIORITY_GWEI));
if (GAS_LIMIT) feeOverrides.gas = GAS_LIMIT;

// --------------------------------------------------------------------------
// Optional OpenSea price sanity-check (read-only; not in the mint hot path)
// --------------------------------------------------------------------------

async function openseaPriceHint() {
  const key = process.env.OPENSEA_API_KEY;
  const slug = process.env.OPENSEA_COLLECTION_SLUG;
  if (!key || !slug) return;
  try {
    const res = await fetch(`https://api.opensea.io/api/v2/collections/${slug}/stats`, {
      headers: { "x-api-key": key, accept: "application/json" },
    });
    if (!res.ok) return;
    const data = await res.json();
    const floor = data?.total?.floor_price;
    if (floor != null) {
      console.log(`  OpenSea floor for "${slug}": ${floor} ${data?.total?.floor_price_symbol ?? ""}`);
      const pu = Number(PRICE_PER_UNIT_ETH);
      if (pu > 0 && floor > 0 && pu > floor * 1.5) {
        console.log(
          `  ⚠️  Your mint price (${pu}) is well above OpenSea floor (${floor}). ` +
            `You may be able to buy cheaper on the secondary market — double-check before arming.`
        );
      }
    }
  } catch {
    /* price hint is best-effort only */
  }
}

// --------------------------------------------------------------------------
// The mint gate
// --------------------------------------------------------------------------

async function statusFlagOpen() {
  if (!statusAbi) return null; // unknown -> caller falls back to simulate
  try {
    const v = await publicClient.readContract({
      address,
      abi: [statusAbi],
      functionName: statusAbi.name,
      args: [],
    });
    return Boolean(v);
  } catch {
    return null; // treat unreadable flag as "unknown", let simulate decide
  }
}

async function simulateMint() {
  // Returns the prepared request when the call would succeed, else throws.
  const { request } = await publicClient.simulateContract({
    account,
    address,
    abi: [mintAbi],
    functionName: mintAbi.name,
    args,
    value: TOTAL_VALUE,
    ...feeOverrides,
  });
  return request;
}

async function fireOnce(request) {
  if (DRY_RUN) {
    console.log("\n✅ SALE IS LIVE — but MINT_DRY_RUN is set, so NOT sending. Re-run without it to mint.");
    return true;
  }
  console.log("\n🚀 SALE IS LIVE — sending mint transaction (once)…");
  const hash = await walletClient.writeContract(request);
  console.log(`  tx sent: ${hash}`);
  if (EXPLORER) console.log(`  tx: ${EXPLORER}/tx/${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const ok = receipt.status === "success";
  console.log(`  status: ${ok ? "✅ SUCCESS" : "❌ REVERTED"}  (block ${receipt.blockNumber}, gas ${receipt.gasUsed})`);
  return true;
}

async function main() {
  console.log("NFT mint sniper");
  console.log(`  wallet    : ${account.address}`);
  console.log(`  contract  : ${address}`);
  console.log(`  chainId   : ${CHAIN_ID}  rpc: ${RPC}`);
  console.log(`  call      : ${mintAbi.name}(${args.map(String).join(", ")})`);
  console.log(`  value     : ${formatEther(TOTAL_VALUE)} ${chain.nativeCurrency.symbol} (= ${PRICE_PER_UNIT_ETH} x ${QUANTITY})`);
  console.log(`  gate      : ${statusAbi ? `${statusAbi.name}() then simulate` : "simulate probe"}`);
  console.log(`  poll      : every ${POLL_MS}ms`);
  console.log(`  mode      : ${DRY_RUN ? "DRY RUN (never sends)" : "ARMED (will send once when live)"}`);

  const bal = await publicClient.getBalance({ address: account.address });
  console.log(`  balance   : ${formatEther(bal)} ${chain.nativeCurrency.symbol}`);
  await openseaPriceHint();

  if (TOTAL_VALUE > bal) {
    console.error(
      `\n❌ Wallet balance (${formatEther(bal)}) is below the mint value (${formatEther(TOTAL_VALUE)}) — fund it first.`
    );
    process.exit(1);
  }

  console.log(`\nWatching for the sale to open… (Ctrl-C to stop)\n`);
  let attempts = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempts += 1;
    try {
      // 1) cheap read flag, if known
      const flag = await statusFlagOpen();
      if (flag === false) {
        tick(attempts, "sale flag: closed");
      } else {
        // flag true OR unknown -> confirm with a real simulate of OUR call
        const request = await simulateMint();
        await fireOnce(request);
        return;
      }
    } catch (e) {
      tick(attempts, `not live yet (${shortErr(e)})`);
    }
    if (MAX_ATTEMPTS && attempts >= MAX_ATTEMPTS) {
      console.log(`\nReached MINT_MAX_ATTEMPTS=${MAX_ATTEMPTS} without the sale opening. Exiting.`);
      return;
    }
    await sleep(POLL_MS);
  }
}

function tick(n, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  process.stdout.write(`\r[${ts}] attempt ${n}: ${msg}                    `);
}

function shortErr(e) {
  const m = e?.shortMessage ?? e?.message ?? String(e);
  return m.split("\n")[0].slice(0, 80);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(`\nFATAL: ${e?.shortMessage ?? e?.message ?? e}`);
  process.exit(1);
});
