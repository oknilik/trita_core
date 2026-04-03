/**
 * I3 — Billing structured tracing
 *
 * Strukturált logolás a billing orchestrationhöz.
 * Console.log wrapper ami konzisztens JSON formátumot ad.
 */

export interface BillingTraceContext {
  stripeEventId: string;
  eventType: string;
  productType?: string;
  sourceEntityId?: string;
  billingoPartnerId?: string | number;
  billingoDocumentId?: string | number;
  resultStatus: "success" | "skipped" | "failed" | "processing";
  errorCode?: string;
  durationMs?: number;
}

export function traceBillingEvent(ctx: BillingTraceContext): void {
  const entry = {
    _tag: "billing",
    ts: new Date().toISOString(),
    ...ctx,
  };

  if (ctx.resultStatus === "failed") {
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
  traceBillingEvent({ ...ctx, resultStatus: "processing" });

  try {
    const result = await fn();
    traceBillingEvent({
      ...ctx,
      resultStatus: "success",
      durationMs: Date.now() - start,
    });
    return result;
  } catch (err) {
    traceBillingEvent({
      ...ctx,
      resultStatus: "failed",
      errorCode: err instanceof Error ? err.message.slice(0, 100) : "unknown",
      durationMs: Date.now() - start,
    });
    throw err;
  }
}
