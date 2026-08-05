import { prisma } from "@/lib/prisma";
import { OPEN_DEAL_STAGES } from "@/lib/crm/constants";
import { createSystemActivity } from "@/lib/crm/activity-log";

// ─────────────────────────────────────────────────────────────────────
// Beérkező inquiry auto-csatolása nyitott dealhez (email-match).
//
// Külön modul, hogy a submitInquiry (lib/inquiries.ts) importja ne
// húzzon kör-függést a deals-szolgáltatásokkal. A hívó best-effort
// try/catch-ben hívja: a csatolás hibája nem törheti a contact-flow-t.
// ─────────────────────────────────────────────────────────────────────

const MESSAGE_EXCERPT_LENGTH = 500;

export interface AutoAttachResult {
  dealId: string;
}

/**
 * Ha a beküldő emailjéhez tartozik nyitott deal (case-insensitive match a
 * legfrissebb nyitottra), az inquiry rálinkelődik és SYSTEM-activity kerül
 * az idővonalra. Nincs auto-deal-létrehozás — a pipeline-ba kerülés
 * kvalifikációs döntés marad. Nincs találat / már linkelt: null.
 */
export async function attachInquiryToOpenDeal(
  inquiryId: string,
  email: string,
): Promise<AutoAttachResult | null> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, dealId: true, name: true, message: true },
  });
  if (!inquiry || inquiry.dealId) return null;

  const deal = await prisma.deal.findFirst({
    where: {
      stage: { in: [...OPEN_DEAL_STAGES] },
      contactEmail: { equals: email.trim(), mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!deal) return null;

  await prisma.$transaction(async (tx) => {
    await tx.inquiry.update({ where: { id: inquiry.id }, data: { dealId: deal.id } });
    await createSystemActivity(
      tx,
      deal.id,
      `Új megkeresés érkezett (${inquiry.name})`,
      inquiry.message.slice(0, MESSAGE_EXCERPT_LENGTH),
    );
  });

  return { dealId: deal.id };
}
