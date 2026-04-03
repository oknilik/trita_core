import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { stripe, TIER_CONFIG } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { resolvePartner, resolvePartnerForPurchase } from "@/lib/billing/partner-resolver";
import { resolveVatDecision } from "@/lib/billing/vat-decision";
import { buildPurchaseInvoiceItem } from "@/lib/billing/invoice-items";
import { normalizeInvoicePayload } from "@/lib/billing/invoice-normalizer";
import { createInvoiceDocument } from "@/lib/billing/billingo-client";

export const metadata: Metadata = {
  title: "Sikeres vásárlás | Trita",
  robots: { index: false },
};

const REDIRECT_MAP: Record<string, string> = {
  self_plus:      "/profile/results",
  team_snapshot: JOURNEY_HOME_HANDOFF_PATH,
  team_deep_dive: JOURNEY_HOME_HANDOFF_PATH,
};

const MESSAGES: Record<string, string> = {
  self_plus:
    "Plus csomagod aktiválva. Teljes személyiségprofil, observer visszajelzés, vakfolt-elemzés és fejlődési fókuszok várnak.",
  team_snapshot:
    "Team Snapshot aktiválva. A csapatod diagnózisa, heatmap-je és összefoglalója elérhető.",
  team_deep_dive:
    "Team Deep Dive aktiválva. A csapatod mély elemzése és 1 db beépített tanácsadói konzultáció vár rád.",
};

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);

  let tier = "unknown";
  let teamId: string | undefined;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    tier = session.metadata?.tier ?? "unknown";
    teamId = session.metadata?.teamId || undefined;

    // ── Idempotent purchase sync ──────────────────────────────────────────
    // The webhook is the truth source, but it may arrive after the user
    // lands here. Create the purchase if it doesn't exist yet — the webhook
    // handler checks stripeCheckoutSessionId and skips duplicates.
    if (
      tier !== "unknown" &&
      session.mode === "payment" &&
      session.payment_status === "paid" &&
      session.metadata?.type === "one_time_purchase"
    ) {
      const existing = await prisma.purchase.findFirst({
        where: { stripeCheckoutSessionId: sessionId },
      });

      if (!existing) {
        const config = TIER_CONFIG[tier];
        const purchase = await prisma.purchase.create({
          data: {
            userProfileId: profile.id,
            orgId: session.metadata.orgId || null,
            teamId: session.metadata.teamId || null,
            tier,
            productType: tier,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            stripeCheckoutSessionId: sessionId,
            amount: session.amount_total ?? 0,
            grossAmount: session.amount_total ?? 0,
            currency: session.currency ?? "eur",
            status: "completed",
            invoiceStatus: "pending",
            includesAdvisory: config?.includesAdvisory ?? false,
            includedCredits: config?.includedCredits ?? 0,
          },
        });

        // ── Billingo invoice (non-blocking) ────────────────────────
        try {
          const partnerInput = await resolvePartnerForPurchase({
            productType: tier,
            userId: profile.id,
            organizationId: session.metadata.orgId || undefined,
          });
          const partner = await resolvePartner(partnerInput);
          const vatDecision = resolveVatDecision({ countryCode: partnerInput.countryCode });
          const item = buildPurchaseInvoiceItem(tier, 1, vatDecision);
          const payload = normalizeInvoicePayload({
            partnerId: partner.billingoPartnerId,
            vatDecision,
            items: [item],
          });
          const doc = await createInvoiceDocument(payload);

          await prisma.billingDocumentLink.create({
            data: {
              sourceType: "purchase",
              sourceId: purchase.id,
              stripeCheckoutSessionId: sessionId,
              billingoDocumentId: String(doc.id),
              billingoDocumentNumber: doc.invoiceNumber,
              documentType: "invoice",
              status: "issued",
            },
          });
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              billingoDocumentId: String(doc.id),
              billingoDocumentNumber: doc.invoiceNumber,
              invoiceStatus: "issued",
            },
          });
        } catch (billingoErr) {
          // Non-blocking — purchase already created, Billingo retry possible
          console.error("[Billing/Success] Billingo invoice failed:", billingoErr);
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { invoiceStatus: "failed" },
          });
        }
      }
    }
  } catch {
    redirect(JOURNEY_HOME_HANDOFF_PATH);
  }

  const targetUrl =
    (tier === "team_snapshot" || tier === "team_deep_dive") && teamId
      ? `/team/${teamId}`
      : (REDIRECT_MAP[tier] ?? JOURNEY_HOME_HANDOFF_PATH);

  const message = MESSAGES[tier] ?? "Vásárlásod sikeresen feldolgozva.";

  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <p
          className="font-fraunces text-5xl"
          style={{ color: "var(--color-bronze)" }}
          aria-hidden="true"
        >
          ✦
        </p>
        <h1 className="mt-4 font-fraunces text-2xl text-ink">
          Sikeres vásárlás!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {message}
        </p>
        <a
          href={targetUrl}
          className="mt-8 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-8 text-sm font-semibold text-white transition hover:bg-sage-dark"
        >
          Tovább →
        </a>
      </div>
    </div>
  );
}
