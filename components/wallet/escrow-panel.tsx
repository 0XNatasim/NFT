"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { parseEther } from "viem";
import { toast } from "sonner";
import { Loader2, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MONAD_CHAIN_ID, SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import { settlementAbi } from "@/lib/contracts/settlement";
import { formatMon } from "@/lib/utils";

/**
 * Self-managed MON escrow on the settlement contract. Funds maker-side
 * MON legs of deals; fully user-controlled (deposit/withdraw anytime).
 */
export function EscrowPanel() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("");
  const [working, setWorking] = useState<"deposit" | "withdraw" | null>(null);

  const balanceQuery = useQuery({
    queryKey: ["escrow-balance", address],
    enabled: !!address && !!publicClient,
    queryFn: () =>
      publicClient!.readContract({
        address: SETTLEMENT_CONTRACT_ADDRESS,
        abi: settlementAbi,
        functionName: "escrowBalance",
        args: [address!],
      }),
  });

  function parsedAmount(): bigint | null {
    try {
      const wei = parseEther(amount);
      return wei > 0n ? wei : null;
    } catch {
      return null;
    }
  }

  async function run(action: "deposit" | "withdraw") {
    if (!publicClient) return;
    if (chainId !== MONAD_CHAIN_ID) {
      toast.error(`Switch your wallet to Monad (chain ${MONAD_CHAIN_ID}) first`);
      return;
    }
    const wei = parsedAmount();
    if (!wei) {
      toast.error("Enter a valid MON amount");
      return;
    }
    if (action === "withdraw" && wei > (balanceQuery.data ?? 0n)) {
      toast.error("Amount exceeds your escrow balance");
      return;
    }
    setWorking(action);
    try {
      const hash = await writeContractAsync(
        action === "deposit"
          ? {
              address: SETTLEMENT_CONTRACT_ADDRESS,
              abi: settlementAbi,
              functionName: "deposit",
              value: wei,
            }
          : {
              address: SETTLEMENT_CONTRACT_ADDRESS,
              abi: settlementAbi,
              functionName: "withdraw",
              args: [wei],
            }
      );
      toast.info(action === "deposit" ? "Depositing…" : "Withdrawing…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted");
      toast.success(
        action === "deposit"
          ? `Deposited ${formatMon(wei)} MON to escrow`
          : `Withdrew ${formatMon(wei)} MON from escrow`
      );
      setAmount("");
      balanceQuery.refetch();
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? `${action} failed`);
    } finally {
      setWorking(null);
    }
  }

  if (!address) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Vault className="h-4 w-4 text-monad-purple" /> MON escrow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Funds the MON side of deals you propose. Only you can deposit or
          withdraw — the platform has no access.
        </p>
        <p className="text-2xl font-bold text-monad-purple">
          {balanceQuery.isLoading
            ? "…"
            : `${formatMon(balanceQuery.data ?? 0n)} MON`}
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="0.0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={working !== null}
            onClick={() => run("deposit")}
          >
            {working === "deposit" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Deposit"
            )}
          </Button>
          <Button
            variant="outline"
            disabled={working !== null}
            onClick={() => run("withdraw")}
          >
            {working === "withdraw" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Withdraw"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}