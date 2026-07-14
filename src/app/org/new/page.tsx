import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { getServerLocale } from "@/lib/i18n-server";
import { isConsultingLed } from "@/lib/operating-mode";
import { NewClientOrgForm } from "@/components/org/NewClientOrgForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Új ügyfél-szervezet | Trita", robots: { index: false } };
}

// Tanácsadói ügyfél-org létrehozás — csak consulting-led módban, csak
// kijelölt tanácsadónak. Self-serve váltásnál (operating-mode) eltűnik.
export default async function NewClientOrgPage() {
  if (!isConsultingLed()) notFound();

  const [locale, { userId }] = await Promise.all([getServerLocale(), getServerAuth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const consultantMembership = await prisma.organizationMember.findFirst({
    where: { userId: profile.id, role: "ORG_CONSULTANT", leftAt: null },
    select: { id: true },
  });
  if (!consultantMembership) notFound();

  const isHu = locale !== "en";

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-bronze"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {isHu ? "Vissza" : "Back"}
        </Link>

        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">
            {isHu ? "// tanácsadói felület" : "// consultant workspace"}
          </p>
          <h1 className="mt-1 font-fraunces text-3xl text-ink">
            {isHu ? "Új ügyfél-szervezet" : "New client organization"}
          </h1>
          <p className="mt-2 text-sm text-ink-body">
            {isHu
              ? "A szervezetbe tanácsadóként lépsz be. Ezután te hívod meg a tagokat, sorolod őket csapatokba és indítod a méréseket — az ügyfél admin később is csatlakozhat."
              : "You join the organization as its consultant. You then invite members, assign them to teams and launch measurements — the client admin can join later."}
          </p>
        </div>

        <NewClientOrgForm isHu={isHu} />
      </main>
    </div>
  );
}
