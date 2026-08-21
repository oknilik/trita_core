import type { EmailSendResult } from "@/lib/emails";

/**
 * A Resend alapértelmezett plafonja 10 kérés/másodperc. Nyolcnál maradunk,
 * hogy a többi tranzakcionális levélnek is maradjon hely ugyanazon a teamen.
 */
export const NEWSLETTER_SENDS_PER_SECOND = 8;
export const NEWSLETTER_SEND_MAX_ATTEMPTS = 3;

const START_INTERVAL_MS = Math.ceil(1000 / NEWSLETTER_SENDS_PER_SECOND) + 5;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Globális indulási sor egy digest/issue futáson belül. */
function createStartLimiter() {
  let tail = Promise.resolve();
  let nextStartAt = 0;

  return async () => {
    let release!: () => void;
    const previous = tail;
    tail = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    const waitMs = Math.max(0, nextStartAt - Date.now());
    if (waitMs > 0) await delay(waitMs);
    nextStartAt = Date.now() + START_INTERVAL_MS;
    release();
  };
}

// Egy Node-folyamaton belül a megerősítő, digest- és szerkesztett levelek
// ugyanazt a keretet használják. Így több, egymással párhuzamos API/cron hívás
// sem indít külön-külön 8 kérést ugyanabban a másodpercben.
const acquireNewsletterSendStart = createStartLimiter();

export interface NewsletterQueueOutcome<T> {
  item: T;
  result: EmailSendResult;
  attempts: number;
}

/**
 * Limitált, kivételbiztos tömeges küldés.
 *
 * Minden retry ugyanazt a hívót futtatja, ezért a hívó felelőssége ugyanazt
 * az idempotency key-t átadni. `Promise.allSettled` miatt egyetlen váratlan
 * kivétel sem szakítja félbe a többi címzett állapotának könyvelését.
 */
export async function runNewsletterSendQueue<T>(
  items: T[],
  send: (item: T) => Promise<EmailSendResult>,
): Promise<Array<NewsletterQueueOutcome<T>>> {
  const settled = await Promise.allSettled(
    items.map(async (item): Promise<NewsletterQueueOutcome<T>> => {
      let last: EmailSendResult = {
        ok: false,
        uncertain: true,
        retryable: true,
        code: "not_attempted",
        message: "Send was not attempted",
      };

      for (let attempt = 1; attempt <= NEWSLETTER_SEND_MAX_ATTEMPTS; attempt += 1) {
        await acquireNewsletterSendStart();
        last = await send(item);
        if (last.ok || !last.retryable) return { item, result: last, attempts: attempt };
        if (attempt < NEWSLETTER_SEND_MAX_ATTEMPTS) {
          // 500 ms, majd 1500 ms. A start limiter a retry indulását is
          // beleszámítja a közös 8/s keretbe.
          await delay(500 * (2 ** (attempt - 1) + attempt - 1));
        }
      }

      return { item, result: last, attempts: NEWSLETTER_SEND_MAX_ATTEMPTS };
    }),
  );

  return settled.map((entry, index) => {
    if (entry.status === "fulfilled") return entry.value;
    const reason = entry.reason;
    return {
      item: items[index]!,
      attempts: 1,
      result: {
        ok: false,
        uncertain: true,
        retryable: false,
        code: "queue_exception",
        message: reason instanceof Error ? reason.message : "Unexpected queue exception",
      },
    };
  });
}
