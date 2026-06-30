/**
 * Structured transaction logging for every on-chain step.
 *
 * Every write flow (accept, cancel, approve, deposit, withdraw, …) reports its
 * lifecycle here so failures are diagnosable. Records are kept in a bounded
 * in-memory ring buffer that the developer-only debug panel reads. Console
 * output is gated to development so production stays quiet, but the buffer is
 * always populated (it never leaves the browser).
 */

export type TxPhase =
  | "prepare"
  | "validate"
  | "simulate"
  | "simulated"
  | "submit"
  | "submitted"
  | "receipt"
  | "success"
  | "error";

export interface TxLogContext {
  /** Human-readable action, e.g. "Accept deal". */
  label: string;
  /** Connected wallet address. */
  wallet?: string;
  /** Chain id the wallet is currently on. */
  chainId?: number;
  /** Target contract address. */
  contract?: string;
  /** Contract function being called. */
  functionName?: string;
  /** Stringified call arguments. */
  args?: unknown;
  /** msg.value (wei) when applicable. */
  value?: string;
}

export interface TxLogRecord extends TxLogContext {
  id: string;
  phase: TxPhase;
  at: number;
  /** Result of simulateContract, when run. */
  simulationOk?: boolean;
  /** Submitted transaction hash. */
  txHash?: string;
  /** Receipt status once mined. */
  receiptStatus?: "success" | "reverted";
  /** Classified error name (e.g. UserRejected, OrderExpired). */
  errorName?: string;
  /** Raw error message. */
  errorMessage?: string;
  /** Decoded contract revert reason, when available. */
  revertReason?: string;
}

const MAX_RECORDS = 200;
const buffer: TxLogRecord[] = [];
const subscribers = new Set<(records: TxLogRecord[]) => void>();

function isDev(): boolean {
  // Console output in development only; the buffer is always populated so the
  // dev debug panel works without spamming test/production logs.
  return process.env.NODE_ENV === "development";
}

function emit() {
  const snapshot = buffer.slice();
  for (const fn of subscribers) fn(snapshot);
}

function pushRecord(record: TxLogRecord) {
  buffer.push(record);
  if (buffer.length > MAX_RECORDS) buffer.splice(0, buffer.length - MAX_RECORDS);
  emit();

  if (isDev()) {
    const tag = `[tx:${record.label}] ${record.phase}`;
    const payload = {
      wallet: record.wallet,
      chainId: record.chainId,
      contract: record.contract,
      fn: record.functionName,
      args: record.args,
      value: record.value,
      simulationOk: record.simulationOk,
      txHash: record.txHash,
      receiptStatus: record.receiptStatus,
      errorName: record.errorName,
      errorMessage: record.errorMessage,
      revertReason: record.revertReason,
    };
    if (record.phase === "error") console.error(tag, payload);
    else console.debug(tag, payload);
  }
}

/** Stable id for grouping a single transaction's lifecycle records. */
export function newTxId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Append a transaction-lifecycle record. */
export function logTx(
  id: string,
  phase: TxPhase,
  ctx: TxLogContext,
  extra: Partial<TxLogRecord> = {},
): void {
  pushRecord({
    id,
    phase,
    at: Date.now(),
    ...ctx,
    ...extra,
    // serialise args/value defensively so bigints never throw in the panel
    args: ctx.args !== undefined ? safeStringify(ctx.args) : undefined,
    value: ctx.value,
  });
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_k, v) =>
      typeof v === "bigint" ? `${v.toString()}n` : v,
    );
  } catch {
    return String(value);
  }
}

/** Current buffered records (most recent last). */
export function getTxLog(): TxLogRecord[] {
  return buffer.slice();
}

/** Clear the buffer (debug panel control). */
export function clearTxLog(): void {
  buffer.length = 0;
  emit();
}

/** Subscribe to buffer changes; returns an unsubscribe fn. */
export function subscribeTxLog(
  fn: (records: TxLogRecord[]) => void,
): () => void {
  subscribers.add(fn);
  fn(buffer.slice());
  return () => subscribers.delete(fn);
}
