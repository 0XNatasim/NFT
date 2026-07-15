"use client";

import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReadinessReport } from "@/lib/deal-rooms/readiness";

/**
 * Live settlement-readiness: what the contract would enforce at fill time,
 * surfaced before anyone signs. Derived state — the chain is the authority.
 */
export function ReadinessPanel({
  readiness,
  loading,
}: {
  readiness: ReadinessReport | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Settlement readiness</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !readiness ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {readiness.checks.map((check) => (
              <li key={check.id} className="flex items-start gap-2 text-sm">
                {check.status === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : check.status === "action_required" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                ) : (
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <span
                    className={
                      check.status === "ok" ? "text-muted-foreground" : ""
                    }
                  >
                    {check.label}
                  </span>
                  {check.detail && (
                    <p className="text-xs text-amber-400/90">{check.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
