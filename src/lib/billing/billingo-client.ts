/**
 * C1 — Billingo API v3 kliens
 *
 * Központi Billingo service layer. Fetch-based, nincs SDK dependency.
 * Rate limit kezelés + error mapping + retry support.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BillingoPartnerInput {
  name: string;
  email: string;
  countryCode: string;
  taxNumber?: string;
  euVatNumber?: string;
  address?: {
    street: string;
    city: string;
    zip: string;
    countryCode: string;
  };
}

export interface BillingoInvoiceItem {
  name: string;
  unitPrice: number;       // nettó egységár a Billingo pénznemében
  quantity: number;
  unit: string;             // "db" | "pcs"
  vat: string;              // "27%" | "EU" | "AAM" (ÁFA mentes)
  grossAmount?: number;
}

export interface BillingoInvoiceInput {
  partnerId: number;
  blockId: number;
  currency: string;         // "HUF" | "EUR"
  language: string;         // "hu" | "en"
  type: "invoice" | "proforma";
  paymentMethod: string;    // "online_bankcard"
  items: BillingoInvoiceItem[];
  fulfillmentDate?: string; // YYYY-MM-DD
  dueDate?: string;         // YYYY-MM-DD
  comment?: string;
}

export interface BillingoDocument {
  id: number;
  invoiceNumber: string;
  status: string;
}

export class BillingoApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: unknown,
    public retryable: boolean,
  ) {
    super(message);
    this.name = "BillingoApiError";
  }
}

// ── Client ─────────────────────────────────────────────────────────────────────

const BILLINGO_BASE_URL = "https://api.billingo.hu/v3";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function getApiKey(): string {
  const key = process.env.BILLINGO_API_KEY;
  if (!key) throw new Error("BILLINGO_API_KEY is not configured");
  return key;
}

function getBlockId(): number {
  const id = process.env.BILLINGO_BLOCK_ID;
  if (!id) throw new Error("BILLINGO_BLOCK_ID is not configured");
  return Number(id);
}

async function billingoFetch(
  path: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<Response> {
  const url = `${BILLINGO_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "X-API-KEY": getApiKey(),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Rate limit → retry
  if (res.status === 429 && retryCount < MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (retryCount + 1)));
    return billingoFetch(path, options, retryCount + 1);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new BillingoApiError(
      `Billingo API error: ${res.status} ${res.statusText}`,
      res.status,
      body,
      res.status === 429 || res.status >= 500,
    );
  }

  return res;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function findOrCreatePartner(
  input: BillingoPartnerInput,
): Promise<number> {
  // Search by email first
  const searchRes = await billingoFetch(
    `/partners?query=${encodeURIComponent(input.email)}`,
  );
  const searchData = await searchRes.json();
  const existing = searchData?.data?.[0];
  if (existing?.id) return existing.id;

  // Create new partner
  const createRes = await billingoFetch("/partners", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      emails: [input.email],
      taxcode: input.taxNumber ?? "",
      iban: "",
      phone: "",
      address: input.address ?? {
        street_name: "",
        city: "",
        post_code: "",
        country_code: input.countryCode,
      },
    }),
  });
  const created = await createRes.json();
  return created.id;
}

export async function updatePartnerIfNeeded(
  partnerId: number,
  input: BillingoPartnerInput,
): Promise<void> {
  await billingoFetch(`/partners/${partnerId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.name,
      emails: [input.email],
      taxcode: input.taxNumber ?? "",
      address: input.address ?? {
        street_name: "",
        city: "",
        post_code: "",
        country_code: input.countryCode,
      },
    }),
  });
}

export async function createInvoiceDocument(
  input: BillingoInvoiceInput,
): Promise<BillingoDocument> {
  const blockId = input.blockId || getBlockId();

  const payload = {
    partner_id: input.partnerId,
    block_id: blockId,
    currency: input.currency,
    language: input.language,
    type: input.type === "proforma" ? 3 : 1,
    payment_method: input.paymentMethod,
    fulfillment_date: input.fulfillmentDate ?? new Date().toISOString().slice(0, 10),
    due_date: input.dueDate ?? new Date().toISOString().slice(0, 10),
    comment: input.comment ?? "",
    items: input.items.map((item) => ({
      name: item.name,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      unit: item.unit,
      vat: item.vat,
    })),
  };

  const res = await billingoFetch("/documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const doc = await res.json();

  return {
    id: doc.id,
    invoiceNumber: doc.invoice_number ?? doc.id?.toString() ?? "",
    status: "issued",
  };
}

export async function createCorrectionDocument(
  originalDocumentId: number,
): Promise<BillingoDocument> {
  const res = await billingoFetch(`/documents/${originalDocumentId}/cancel`, {
    method: "POST",
  });
  const doc = await res.json();

  return {
    id: doc.id,
    invoiceNumber: doc.invoice_number ?? "",
    status: "voided",
  };
}

export async function getDocument(
  documentId: number,
): Promise<BillingoDocument> {
  const res = await billingoFetch(`/documents/${documentId}`);
  const doc = await res.json();

  return {
    id: doc.id,
    invoiceNumber: doc.invoice_number ?? "",
    status: doc.cancelled ? "voided" : "issued",
  };
}
