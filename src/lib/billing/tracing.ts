/**
 * I3 — Billing structured tracing
 *
 * Strukturált logolás a billing orchestrationhöz.
 * Console.log wrapper ami konzisztens JSON formátumot ad.
 */

export interface BillingTraceContext {
  entryPoint?: string;
  stripeObjectType?: string;
  finalizationPath?: "webhook" | "fallback" | "none";
  outcome?: "success" | "skipped" | "failed" | "processing";
  idempotencyKey?: string;
  stripeEventId: string;
  eventType: string;
  productType?: string;
  sourceEntityId?: string;
  billingoPartnerId?: string | number;
  billingoDocumentId?: string | number;
  // Deprecated alias: prefer `outcome`.
  resultStatus: "success" | "skipped" | "failed" | "processing";
  errorCode?: string;
  durationMs?: number;
}

export function traceBillingEvent(ctx: BillingTraceContext): void {
  const outcome = ctx.outcome ?? ctx.resultStatus;
  const entry = {
    _tag: "billing",
    ts: new Date().toISOString(),
    entryPoint: ctx.entryPoint ?? ctx.eventType ?? "unknown",
    stripeObjectType: ctx.stripeObjectType ?? "unknown",
    finalizationPath: ctx.finalizationPath ?? "none",
    outcome,
    idempotencyKey: ctx.idempotencyKey ?? ctx.stripeEventId,
    ...ctx,
    outcome,
    resultStatus: outcome,
  };

  if (outcome === "failed") {
    console.error("[Billing]", JSON.stringify(entry));
  } else {
    console.log("[Billing]", JSON.stringify(entry));
  }
}

/**
 * Wrap a handler with tracing — automatically logs start, success, or failure.
 */
export async function withBillingTrace<T>(
  ctx: Omit<BillingTraceContext, "resultStatus" | "durationMs">,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  traceBillingEvent({ ...ctx, outcome: "processing", resultStatus: "processing" });

  try {
    const result = await fn();
    traceBillingEvent({
      ...ctx,
      outcome: "success",
      resultStatus: "success",
      durationMs: Date.now() - start,
    });
    return result;
  } catch (err) {
    traceBillingEvent({
      ...ctx,
      outcome: "failed",
      resultStatus: "failed",
      errorCode: err instanceof Error ? err.message.slice(0, 100) : "unknown",
      durationMs: Date.now() - start,
    });
    throw err;
  }
}
