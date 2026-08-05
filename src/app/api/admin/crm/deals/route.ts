import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { DEAL_SOURCES, DEAL_STAGES, type DealStage } from "@/lib/crm/constants";
import { createDeal, createDealFromInquiry, listDeals } from "@/lib/crm/service";
import { crmErrorResponse, unauthorized, validationError } from "../_lib/respond";

// Admin CRM — deal-lista és -létrehozás. A lista szűrhető stage-re,
// kereshető (cím/cég/kontakt), és a ?view=today a „Ma” nézet lekérdezése
// (lejárt + ma esedékes next action). Létrehozás inquiryId-vel a Beérkező
// „Pipeline-ba” döntése (kontakt-átemeléssel), anélkül kézi deal.

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const stageParams = url.searchParams
    .getAll("stage")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  if (stageParams.some((stage) => !(DEAL_STAGES as readonly string[]).includes(stage))) {
    return validationError();
  }
  const view = url.searchParams.get("view");
  if (view !== null && view !== "today") {
    return validationError();
  }

  const deals = await listDeals({
    stages: stageParams.length ? (stageParams as DealStage[]) : undefined,
    view: view === "today" ? "today" : undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ deals });
}

const postSchema = z.object({
  /** Ha adott, a deal a beérkező inquiry-ből jön létre (kontakt-átemelés). */
  inquiryId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  contactName: z.string().min(1).max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  source: z.enum(DEAL_SOURCES).optional(),
  expectedValue: z.number().int().min(0).nullable().optional(),
  adminNote: z.string().max(4000).optional(),
  organizationId: z.string().min(1).optional(),
  userProfileId: z.string().min(1).optional(),
  nextActionAt: z.string().datetime({ offset: true }).optional(),
  nextActionNote: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return validationError();
  const data = parsed.data;

  const shared = {
    title: data.title,
    contactPhone: data.contactPhone,
    company: data.company,
    source: data.source,
    expectedValue: data.expectedValue,
    adminNote: data.adminNote,
    organizationId: data.organizationId,
    userProfileId: data.userProfileId,
    nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : undefined,
    nextActionNote: data.nextActionNote,
  };

  try {
    const deal = data.inquiryId
      ? await createDealFromInquiry(data.inquiryId, {
          ...shared,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
        })
      : data.contactName && data.contactEmail
        ? await createDeal({
            ...shared,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
          })
        : null;
    if (!deal) return validationError();
    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
