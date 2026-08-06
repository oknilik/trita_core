import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEAL_SOURCES, OPEN_DEAL_STAGES, OUTCOME_KINDS } from "@/lib/crm/constants";
import {
  clearNextAction,
  closeDeal,
  CrmServiceError,
  getDealDetail,
  reopenDeal,
  setDealNote,
  setDealStage,
  setNextAction,
  updateDealDetails,
} from "@/lib/crm/service";
import { crmErrorResponse, unauthorized, validationError } from "../../_lib/respond";

// Admin CRM — deal-részlet (GET) és action-alapú mutációk (PATCH), a
// meglévő admin-PATCH mintát követve (discriminated union + rövid
// hibakódok). A stage-gép a service-ben él; a link/attach ágak itt, az
// admin/inquiries route link-mintája szerint.

const isoDateTime = z.string().datetime({ offset: true });

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_details"),
    title: z.string().min(1).max(200).optional(),
    contactName: z.string().min(1).max(200).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(50).nullable().optional(),
    company: z.string().max(200).nullable().optional(),
    source: z.enum(DEAL_SOURCES).optional(),
    expectedValue: z.number().int().min(0).nullable().optional(),
  }),
  z.object({ action: z.literal("set_note"), note: z.string().max(4000).nullable() }),
  z.object({ action: z.literal("set_stage"), stage: z.enum(OPEN_DEAL_STAGES) }),
  z.object({
    action: z.literal("set_next_action"),
    at: isoDateTime,
    note: z.string().max(1000).optional(),
  }),
  z.object({ action: z.literal("clear_next_action") }),
  z.object({ action: z.literal("link_org"), organizationId: z.string().min(1) }),
  z.object({ action: z.literal("unlink_org") }),
  z.object({ action: z.literal("link_user"), userProfileId: z.string().min(1) }),
  z.object({ action: z.literal("unlink_user") }),
  z.object({ action: z.literal("attach_inquiry"), inquiryId: z.string().min(1) }),
  z.object({ action: z.literal("detach_inquiry"), inquiryId: z.string().min(1) }),
  z.object({
    action: z.literal("close_won"),
    outcomeKind: z.enum(OUTCOME_KINDS).optional(),
    outcomeNote: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("close_lost"),
    // Szándékosan optional: a hiányt a service LOST_REASON_REQUIRED kóddal
    // jelzi (beszédesebb, mint egy általános VALIDATION_ERROR).
    outcomeKind: z.enum(OUTCOME_KINDS).optional(),
    outcomeNote: z.string().max(2000).optional(),
  }),
  z.object({ action: z.literal("reopen"), stage: z.enum(OPEN_DEAL_STAGES) }),
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const deal = await getDealDetail(id);
  if (!deal) return NextResponse.json({ error: "DEAL_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ deal });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError();
  const data = parsed.data;

  try {
    switch (data.action) {
      case "set_details": {
        const deal = await updateDealDetails(id, {
          title: data.title,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          company: data.company,
          source: data.source,
          expectedValue: data.expectedValue,
        });
        return NextResponse.json({ deal });
      }
      case "set_note": {
        const deal = await setDealNote(id, data.note);
        return NextResponse.json({ deal });
      }
      case "set_stage": {
        const deal = await setDealStage(id, data.stage);
        return NextResponse.json({ deal });
      }
      case "set_next_action": {
        const deal = await setNextAction(id, new Date(data.at), data.note);
        return NextResponse.json({ deal });
      }
      case "clear_next_action": {
        const deal = await clearNextAction(id);
        return NextResponse.json({ deal });
      }
      case "link_org": {
        const org = await prisma.organization.findUnique({
          where: { id: data.organizationId },
          select: { id: true },
        });
        if (!org) return NextResponse.json({ error: "ORG_NOT_FOUND" }, { status: 404 });
        const deal = await updateDealLink(id, { organizationId: org.id });
        return NextResponse.json({ deal });
      }
      case "unlink_org": {
        const deal = await updateDealLink(id, { organizationId: null });
        return NextResponse.json({ deal });
      }
      case "link_user": {
        const profile = await prisma.userProfile.findUnique({
          where: { id: data.userProfileId },
          select: { id: true },
        });
        if (!profile) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
        const deal = await updateDealLink(id, { userProfileId: profile.id });
        return NextResponse.json({ deal });
      }
      case "unlink_user": {
        const deal = await updateDealLink(id, { userProfileId: null });
        return NextResponse.json({ deal });
      }
      case "attach_inquiry": {
        const inquiry = await prisma.inquiry.findUnique({
          where: { id: data.inquiryId },
          select: { id: true, dealId: true },
        });
        if (!inquiry) return NextResponse.json({ error: "INQUIRY_NOT_FOUND" }, { status: 404 });
        if (inquiry.dealId && inquiry.dealId !== id) {
          return NextResponse.json({ error: "INQUIRY_ALREADY_LINKED" }, { status: 400 });
        }
        await assertDeal(id);
        await prisma.inquiry.update({ where: { id: inquiry.id }, data: { dealId: id } });
        return NextResponse.json({ ok: true });
      }
      case "detach_inquiry": {
        const inquiry = await prisma.inquiry.findUnique({
          where: { id: data.inquiryId },
          select: { id: true, dealId: true },
        });
        if (!inquiry || inquiry.dealId !== id) {
          return NextResponse.json({ error: "INQUIRY_NOT_FOUND" }, { status: 404 });
        }
        await prisma.inquiry.update({ where: { id: inquiry.id }, data: { dealId: null } });
        return NextResponse.json({ ok: true });
      }
      case "close_won": {
        const deal = await closeDeal(id, {
          outcome: "WON",
          outcomeKind: data.outcomeKind,
          outcomeNote: data.outcomeNote,
        });
        return NextResponse.json({ deal });
      }
      case "close_lost": {
        const deal = await closeDeal(id, {
          outcome: "LOST",
          outcomeKind: data.outcomeKind,
          outcomeNote: data.outcomeNote,
        });
        return NextResponse.json({ deal });
      }
      case "reopen": {
        const deal = await reopenDeal(id, data.stage);
        return NextResponse.json({ deal });
      }
    }
  } catch (error) {
    return crmErrorResponse(error);
  }
}

async function assertDeal(dealId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { id: true } });
  if (!deal) throw new CrmServiceError("DEAL_NOT_FOUND");
}

async function updateDealLink(
  dealId: string,
  data: { organizationId?: string | null; userProfileId?: string | null },
) {
  await assertDeal(dealId);
  return prisma.deal.update({ where: { id: dealId }, data });
}
