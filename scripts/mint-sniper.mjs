#!/usr/bin/env node
/*
 * NFT mint sniper — polls a mint contract every second and fires ONE signed
 * mint transaction the instant the public sale goes live.
 *
 * IMPORTANT — what "scan OpenSea for minting" actually means:
 *   Minting is an ON-CHAIN action: a write call to a contract, NOT an OpenSea
 *   API call. OpenSea's API only exposes listings/offers/metadata — it cannot
 *   mint. So this script talks directly to the chain RPC and the contract.
 *   Your OPENSEA_API_KEY is only used (optionally) for a floor-price sanity
 *   check; it is never in the mint hot path.
 *
 * TWO MODES (set MINT_MODE):
 *
 *   seadrop  (for OpenSea SeaDrop collections — e.g. the linked contract,
 *            which exposes mintSeaDrop / updatePublicDrop / getMintStats):
 *     SeaDrop collections CANNOT be minted by calling the NFT contract
 *     directly — its mintSeaDrop is onlyAllowedSeaDrop. Instead you call
 *     mintPublic(nftContract, feeRecipient, minterIfNotPayer, quantity) on the
 *     canonical SeaDrop contract, which then calls the NFT for you. This mode
 *     reads getPublicDrop(nftContract) to auto-discover the mint price and
 *     start/end time, shows a countdown, and fires mintPublic the second the
 *     drop opens.
 *
 *   direct   (generic ERC-721 with its own public mint function):
 *     Calls MINT_FUNCTION on MINT_CONTRACT directly.
 *
 * How the gate works (both modes):
 *   Once per second it dry-runs (simulate / eth_call) your exact mint call,
 *   with your value, from your address. While the drop is closed the call
 *   reverts (NotActive / time-window). The FIRST second it stops reverting the
 *   drop is live for you — the script sends the real signed tx once, waits for
 *   the receipt, prints the explorer link, and exits.
 *
 * SAFETY
 *   - The private key is read ONLY from env (MINT_PRIVATE_KEY). Never logged,
 *     never written to disk, never sent anywhere but as a local signature. Put
 *     it in a git-ignored .env. Prefer a fresh hot wallet funded with just the
 *     mint cost + gas.
 *   - Nothing is broadcast until a dry-run of your own call succeeds, so no gas
 *     is burned on a guaranteed revert. It sends exactly ONCE.
 *   - Start with MINT_DRY_RUN=1 to watch the gate open without spending.
 *
 * Usage:
 *   cp .env.example .env   # fill the MINT_* values (see that file)
 *   node scripts/mint-sniper.mjs
 *   MINT_DRY_RUN=1 node scripts/mint-sniper.mjs
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
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// --------------------------------------------------------------------------
// Config (all via env — nothing sensitive is ever hard-coded)
// --------------------------------------------------------------------------

const MODE = (process.env.MINT_MODE ?? "seadrop").toLowerCase(); // "seadrop" | "direct"
const RPC = req("MINT_RPC_URL");
const CHAIN_ID = Number(req("MINT_CHAIN_ID"));
const CONTRACT = req("MINT_CONTRACT"); // the NFT collection contract
const PRIVATE_KEY = req("MINT_PRIVATE_KEY"); // 0x-prefixed; keep it secret

const QUANTITY = BigInt(process.env.MINT_QUANTITY ?? "1");
const MINT_TO = process.env.MINT_TO ? getAddress(process.env.MINT_TO) : null;

// Optional explicit price-per-unit override (ether units). In seadrop mode the
// price is auto-read from getPublicDrop; set this only to override/fallback.
const PRICE_OVERRIDE_ETH = process.env.MINT_PRICE_ETH ?? "";

// Poll cadence — you asked for every second.
const POLL_MS = Number(process.env.MINT_POLL_MS ?? 1000);

// Gas. If unset, viem/RPC estimate is used.
const GAS_LIMIT = process.env.MINT_GAS_LIMIT ? BigInt(process.env.MINT_GAS_LIMIT) : undefined;
const MAX_FEE_GWEI = process.env.MINT_MAX_FEE_GWEI ?? "";
const PRIORITY_GWEI = process.env.MINT_PRIORITY_GWEI ?? "";

const DRY_RUN = ["1", "true", "yes"].includes((process.env.MINT_DRY_RUN ?? "").toLowerCase());
const MAX_ATTEMPTS = Number(process.env.MINT_MAX_ATTEMPTS ?? "0"); // 0 = forever

// SeaDrop-specific. The canonical SeaDrop 1.0 is deployed deterministically at
// the same address on every chain it's on. VERIFY on the explorer: it is the
// "To" address of any existing mint tx on your collection, or the address
// passed to updateAllowedSeaDrop. Override with MINT_SEADROP_ADDRESS if needed.
const SEADROP_ADDRESS = getAddress(
  process.env.MINT_SEADROP_ADDRESS ?? "0x00005EA00Ac477B1030CE78506496e8C2dE24bf5"
);
// SeaDrop requires an *allowed* fee recipient. OpenSea's canonical fee
// recipient is the default; override with MINT_FEE_RECIPIENT if the creator
// allowlisted a different one (a wrong one reverts with OnlyAllowedFeeRecipient).
const FEE_RECIPIENT = getAddress(
  process.env.MINT_FEE_RECIPIENT ?? "0x0000a26b00c1F0DF003000390027140000fAa719"
);

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
if (MODE !== "seadrop" && MODE !== "direct") {
  console.error(`MINT_MODE must be "seadrop" or "direct" (got "${MODE}").`);
  process.exit(2);
}

const nftAddress = getAddress(CONTRACT);
const account = privateKeyToAccount(PRIVATE_KEY);
const recipient = MINT_TO ?? account.address;

// --------------------------------------------------------------------------
// ABIs
// --------------------------------------------------------------------------

const SEADROP_ABI = [
  parseAbiItem(
    "function mintPublic(address nftContract, address feeRecipient, address minterIfNotPayer, uint256 quantity) payable"
  ),
  {
    type: "function",
    name: "getPublicDrop",
    stateMutability: "view",
    inputs: [{ name: "nftContract", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "mintPrice", type: "uint80" },
          { name: "startTime", type: "uint48" },
          { name: "endTime", type: "uint48" },
          { name: "maxTotalMintableByWallet", type: "uint16" },
          { name: "feeBps", type: "uint16" },
          { name: "restrictFeeRecipient", type: "bool" },
        ],
      },
    ],
  },
];

// getMintStats(minter) -> (minterNumMinted, currentTotalSupply, maxSupply)
const NFT_STATS_ABI = [
  {
    type: "function",
    name: "getMintStats",
    stateMutability: "view",
    inputs: [{ name: "minter", type: "address" }],
    outputs: [
      { name: "minterNumMinted", type: "uint256" },
      { name: "currentTotalSupply", type: "uint256" },
      { name: "maxSupply", type: "uint256" },
    ],
  },
];

// direct mode mint fn, taken from the explorer "Write Contract" tab.
const DIRECT_SIG = process.env.MINT_FUNCTION ?? "function mint(uint256 quantity) payable";
const directAbi = MODE === "direct" ? parseAbiItem(DIRECT_SIG) : null;
const STATUS_SIG = process.env.MINT_STATUS_FN ?? "";
const statusAbi = STATUS_SIG ? parseAbiItem(STATUS_SIG) : null;

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
const SYM = chain.nativeCurrency.symbol;

const publicClient = createPublicClient({ chain, transport: http(RPC) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC) });

const feeOverrides = {};
if (MAX_FEE_GWEI) feeOverrides.maxFeePerGas = parseGwei(String(MAX_FEE_GWEI));
if (PRIORITY_GWEI) feeOverrides.maxPriorityFeePerGas = parseGwei(String(PRIORITY_GWEI));
if (GAS_LIMIT) feeOverrides.gas = GAS_LIMIT;

// --------------------------------------------------------------------------
// Build the call spec for the active mode
// --------------------------------------------------------------------------

// Resolves { target, abi, functionName, args, value } for the mint.
async function buildCall() {
  if (MODE === "seadrop") {
    // Auto-discover mint price (and show start/end) from the drop config.
    let mintPrice = null;
    let drop = null;
    try {
      drop = await publicClient.readContract({
        address: SEADROP_ADDRESS,
        abi: SEADROP_ABI,
        functionName: "getPublicDrop",
        args: [nftAddress],
      });
      mintPrice = BigInt(drop.mintPrice);
    } catch {
      /* fall back to override below */
    }
    if (PRICE_OVERRIDE_ETH !== "") mintPrice = parseEther(String(PRICE_OVERRIDE_ETH));
    if (mintPrice == null) {
      throw new Error(
        "Could not read the public drop price and no MINT_PRICE_ETH override set. " +
          "Check MINT_SEADROP_ADDRESS is the SeaDrop contract for this chain."
      );
    }
    const value = mintPrice * QUANTITY;
    // minterIfNotPayer: zero => mint to the payer (this wallet). If MINT_TO
    // differs, the payer must be registered via updatePayer or SeaDrop reverts.
    const minterIfNotPayer = MINT_TO && MINT_TO !== account.address ? MINT_TO : zeroAddress;
    return {
      target: SEADROP_ADDRESS,
      abi: SEADROP_ABI,
      functionName: "mintPublic",
      args: [nftAddress, FEE_RECIPIENT, minterIfNotPayer, QUANTITY],
      value,
      drop,
      perUnit: mintPrice,
    };
  }

  // direct mode
  const perUnit = PRICE_OVERRIDE_ETH !== "" ? parseEther(String(PRICE_OVERRIDE_ETH)) : 0n;
  const value = perUnit * QUANTITY;
  const args = buildDirectArgs();
  return { target: nftAddress, abi: [directAbi], functionName: directAbi.name, args, value, perUnit };
}

function buildDirectArgs() {
  if (process.env.MINT_ARGS) {
    return JSON.parse(process.env.MINT_ARGS).map((a) => {
      if (a === "{to}") return recipient;
      if (a === "{quantity}") return QUANTITY;
      return typeof a === "number" ? BigInt(a) : a;
    });
  }
  return (directAbi.inputs ?? []).map((inp) => {
    if (inp.type === "address") return recipient;
    if (inp.type.startsWith("uint") || inp.type.startsWith("int")) return QUANTITY;
    if (inp.type === "bool") return true;
    throw new Error(
      `Cannot auto-fill mint arg "${inp.name}:${inp.type}". Set MINT_ARGS as a JSON array ` +
        `(use "{to}" and "{quantity}" placeholders).`
    );
  });
}

// --------------------------------------------------------------------------
// Optional OpenSea price sanity-check (read-only; not in the mint hot path)
// --------------------------------------------------------------------------

async function openseaPriceHint(perUnitWei) {
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
      const pu = Number(formatEther(perUnitWei));
      if (pu > 0 && floor > 0 && pu > floor * 1.5) {
        console.log(
          `  ⚠️  Mint price (${pu}) is well above OpenSea floor (${floor}) — you may buy cheaper on secondary.`
        );
      }
    }
  } catch {
    /* best-effort only */
  }
}

// --------------------------------------------------------------------------
// Gate + fire
// --------------------------------------------------------------------------

async function statusFlagOpen() {
  if (!statusAbi) return null;
  try {
    const v = await publicClient.readContract({
      address: nftAddress,
      abi: [statusAbi],
      functionName: statusAbi.name,
      args: [],
    });
    return Boolean(v);
  } catch {
    return null;
  }
}

async function simulate(call) {
  const { request } = await publicClient.simulateContract({
    account,
    address: call.target,
    abi: call.abi,
    functionName: call.functionName,
    args: call.args,
    value: call.value,
    ...feeOverrides,
  });
  return request;
}

async function fireOnce(request) {
  if (DRY_RUN) {
    console.log("\n✅ DROP IS LIVE — MINT_DRY_RUN set, NOT sending. Re-run without it to mint.");
    return;
  }
  console.log("\n🚀 DROP IS LIVE — sending mint transaction (once)…");
  const hash = await walletClient.writeContract(request);
  console.log(`  tx sent: ${hash}`);
  if (EXPLORER) console.log(`  tx: ${EXPLORER}/tx/${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const ok = receipt.status === "success";
  console.log(`  status: ${ok ? "✅ SUCCESS" : "❌ REVERTED"}  (block ${receipt.blockNumber}, gas ${receipt.gasUsed})`);
}

async function supplyLine() {
  try {
    const [, current, max] = await publicClient.readContract({
      address: nftAddress,
      abi: NFT_STATS_ABI,
      functionName: "getMintStats",
      args: [account.address],
    });
    return `${current}/${max} minted`;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  const call = await buildCall();

  console.log("NFT mint sniper");
  console.log(`  mode      : ${MODE}`);
  console.log(`  wallet    : ${account.address}`);
  console.log(`  nft       : ${nftAddress}`);
  if (MODE === "seadrop") {
    console.log(`  seadrop   : ${SEADROP_ADDRESS}`);
    console.log(`  feeRecip  : ${FEE_RECIPIENT}`);
    if (call.drop) {
      const s = Number(call.drop.startTime);
      const e = Number(call.drop.endTime);
      console.log(`  drop      : starts ${new Date(s * 1000).toISOString()}  ends ${new Date(e * 1000).toISOString()}`);
      console.log(`  perWallet : max ${call.drop.maxTotalMintableByWallet}  feeBps ${call.drop.feeBps}`);
    }
  }
  console.log(`  call      : ${call.functionName}(${call.args.map(String).join(", ")})`);
  console.log(`  price/ea  : ${formatEther(call.perUnit)} ${SYM}`);
  console.log(`  value     : ${formatEther(call.value)} ${SYM} (x ${QUANTITY})`);
  console.log(`  poll      : every ${POLL_MS}ms`);
  console.log(`  submit    : ${DRY_RUN ? "DRY RUN (never sends)" : "ARMED (sends once when live)"}`);

  const bal = await publicClient.getBalance({ address: account.address });
  console.log(`  balance   : ${formatEther(bal)} ${SYM}`);
  const supply = await supplyLine();
  if (supply) console.log(`  supply    : ${supply}`);
  await openseaPriceHint(call.perUnit);

  if (call.value > bal) {
    console.error(`\n❌ Balance (${formatEther(bal)}) < mint value (${formatEther(call.value)}) — fund the wallet first.`);
    process.exit(1);
  }

  console.log(`\nWatching for the drop to open… (Ctrl-C to stop)\n`);
  let attempts = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempts += 1;
    try {
      const flag = await statusFlagOpen();
      if (flag === false) {
        tick(attempts, "sale flag: closed");
      } else {
        const request = await simulate(call);
        await fireOnce(request);
        return;
      }
    } catch (e) {
      tick(attempts, `not live yet (${shortErr(e)})`);
    }
    if (MAX_ATTEMPTS && attempts >= MAX_ATTEMPTS) {
      console.log(`\nReached MINT_MAX_ATTEMPTS=${MAX_ATTEMPTS} without the drop opening. Exiting.`);
      return;
    }
    await sleep(POLL_MS);
  }
}

function tick(n, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  process.stdout.write(`\r[${ts}] attempt ${n}: ${msg}                              `);
}

function shortErr(e) {
  const m = e?.shortMessage ?? e?.message ?? String(e);
  return m.split("\n")[0].slice(0, 90);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(`\nFATAL: ${e?.shortMessage ?? e?.message ?? e}`);
  process.exit(1);
});
