import { describe, expect, it } from "vitest";
import { classifyTxError } from "@/lib/chains/tx-errors";

describe("classifyTxError", () => {
  it("detects user rejection by EIP-1193 code", () => {
    const result = classifyTxError({ code: 4001, message: "denied" });
    expect(result.name).toBe("UserRejected");
    expect(result.userMessage).toMatch(/rejected the request/i);
  });

  it("detects user rejection by message", () => {
    const result = classifyTxError(new Error("User rejected the request."));
    expect(result.name).toBe("UserRejected");
  });

  it("detects insufficient funds", () => {
    const result = classifyTxError(
      new Error("insufficient funds for gas * price + value"),
    );
    expect(result.name).toBe("InsufficientFunds");
    expect(result.userMessage).toMatch(/enough MON/i);
  });

  it("detects gas-too-low (Monad RPC rejection)", () => {
    const result = classifyTxError(new Error("Gas limit too low"));
    expect(result.name).toBe("GasTooLow");
  });

  it("detects wrong network", () => {
    const err = new Error("chain mismatch");
    expect(classifyTxError(err).name).toBe("WrongNetwork");
  });

  it("detects dropped/replaced transactions", () => {
    const result = classifyTxError(
      new Error("replacement transaction underpriced"),
    );
    expect(result.name).toBe("TxDroppedOrReplaced");
  });

  it("detects RPC transport failures", () => {
    const result = classifyTxError(new Error("Failed to fetch"));
    expect(result.name).toBe("RpcError");
  });

  it("detects a generic on-chain revert", () => {
    const result = classifyTxError(new Error("execution reverted"));
    expect(result.name).toBe("ContractReverted");
  });

  it("falls back to the raw message for unknown errors", () => {
    const result = classifyTxError(new Error("something weird happened"));
    expect(result.name).toBe("Unknown");
    expect(result.userMessage).toBe("something weird happened");
  });

  it("never throws on non-Error inputs", () => {
    expect(() => classifyTxError(undefined)).not.toThrow();
    expect(() => classifyTxError("a string")).not.toThrow();
    expect(() => classifyTxError(null)).not.toThrow();
  });
});
