import { prisma } from "@/lib/prisma";
import { getAdminEmails } from "@/lib/auth";
import { INQUIRY_TOPIC_LABELS } from "@/lib/inquiry-topics";
import { attachInquiryToOpenDeal } from "@/lib/crm/auto-attach";
import { handleInquiryReceived } from "@/lib/notifications";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { createLogger } from "@/lib/logger";

const log = createLogger("inquiries");

// Inquiry-pipeline közös belépője: a /contact űrlap és az in-app
// „Kérdésem van" form ugyanide fut be. Perzisztál, auto-linkel
// (email → user → aktív org), notifot küld az adminoknak + a linkelt org
// tanácsadóinak, és best-effort admin-emailt küld.

// A téma-címkék függőség-mentes modulba költöztek (a CRM is használja) —
// az eddigi import-útvonal változatlanul él.
export { INQUIRY_TOPIC_LABELS } from "@/lib/inquiry-topics";

export interface SubmitInquiryParams {
  name: string;
  email: string;
  company?: string | null;
  topic: string;
  message: string;
  source: "contact_form" | "in_app";
  /** Ha ismert (in-app), a session-ből — különben email-alapú auto-link. */
  userProfileId?: string | null;
  organizationId?: string | null;
}

export interface SubmitInquiryResult {
  inquiryId: string;
  emailSent: boolean;
}

export async function submitInquiry(params: SubmitInquiryParams): Promise<SubmitInquiryResult> {
  const senderEmail = params.email.trim().toLowerCase();

  // Auto-link, ha a hívó nem adta meg (contact form)
  let userProfileId = params.userProfileId ?? null;
  let organizationId = params.organizationId ?? null;
  if (!userProfileId) {
    const linkedProfile = await prisma.userProfile.findFirst({
      where: { deleted: false, email: { equals: senderEmail, mode: "insensitive" } },
      select: {
        id: true,
        activeOrgId: true,
        orgMemberships: { select: { orgId: true }, take: 1 },
      },
    });
    userProfileId = linkedProfile?.id ?? null;
    organizationId =
      organizationId ??
      linkedProfile?.activeOrgId ??
      linkedProfile?.orgMemberships[0]?.orgId ??
      null;
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      name: params.name,
      email: senderEmail,
      company: params.company?.trim() || null,
      topic: params.topic,
      message: params.message,
      source: params.source,
      userProfileId,
      organizationId,
    },
    select: { id: true },
  });

  // CRM auto-attach: ha a beküldő emailjéhez tartozik nyitott deal, az
  // inquiry rálinkelődik (SYSTEM-activityvel). Best effort — a hibája nem
  // törheti a contact-flow-t. Auto-deal-létrehozás szándékosan NINCS: a
  // pipeline-ba kerülés kvalifikációs döntés az admin Beérkező nézetében.
  try {
    await attachInquiryToOpenDeal(inquiry.id, senderEmail);
  } catch (error) {
    log.error(
      { event: "inquiries.crm_auto_attach_failed", err: error },
      "CRM auto-attach failed",
    );
  }

  // In-app notif: adminok + (org-link esetén) tanácsadók
  const adminEmails = getAdminEmails();
  const adminProfiles = adminEmails.length
    ? await prisma.userProfile.findMany({
        where: { deleted: false, email: { in: adminEmails, mode: "insensitive" } },
        select: { id: true },
      })
    : [];
  await handleInquiryReceived({
    inquiryId: inquiry.id,
    senderName: params.name,
    topicLabel: INQUIRY_TOPIC_LABELS[params.topic] ?? params.topic,
    organizationId,
    adminUserIds: adminProfiles.map((p) => p.id),
  });

  // Admin-email — best effort, a hibája nem hiba a beküldőnek
  let emailSent = false;
  try {
    const to = process.env.CONTACT_FORM_TO ?? "info@trita.io";
    const topicLabel = INQUIRY_TOPIC_LABELS[params.topic] ?? params.topic;
    const sourceLabel = params.source === "in_app" ? "in-app kérdés" : "kapcsolat űrlap";
    const text = [
      `Új megkeresés érkezett (${sourceLabel}).`,
      "",
      `Név: ${params.name}`,
      `Email: ${senderEmail}`,
      `Téma: ${topicLabel}`,
      `Cég: ${params.company?.trim() || "-"}`,
      `Beküldve: ${new Date().toISOString()}`,
      "",
      "Üzenet:",
      params.message,
      "",
      "Kezelés: /admin?tab=inquiries",
    ].join("\n");
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: senderEmail,
      subject: `[trita kérdés] ${topicLabel} — ${params.name}`,
      text,
    });
    if (error) {
      log.error({ event: "inquiries.resend_returned_error", err: error }, "Resend returned error");
    } else {
      emailSent = true;
    }
  } catch (error) {
    log.error({ event: "inquiries.unexpected_email_error", err: error }, "Unexpected email error");
  }

  return { inquiryId: inquiry.id, emailSent };
}
