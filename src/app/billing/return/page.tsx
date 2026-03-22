import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/candidate-credits";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Fizetés eredménye | Trita", robots: { index: false } };
}

const CREDIT_LABELS: Record<number, string> = {
  1: "1× jelölt értékelés",
  5: "5× jelölt értékelés",
  10: "10× jelölt értékelés",
};

export default async function ReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; addon?: string }>;
}) {
  const [locale, params] = await Promise.all([getServerLocale(), searchParams]);
  const sessionId = params.session_id;
  const addon = params.addon;
  const isHu = locale !== "en";

  if (!sessionId) redirect("/dashboard");

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    redirect("/dashboard");
  }

  if (session.status === "open") {
    redirect("/billing/checkout");
  }

  if (session.status === "complete") {
    const isCandidateAddon =
      addon === "candidate" &&
      session.mode === "payment" &&
      session.metadata?.type === "candidate_addon" &&
      !!session.metadata?.orgId;

    let orgId: string | null = null;

    if (isCandidateAddon) {
      orgId = session.metadata!.orgId;
      const creditCount = parseInt(session.metadata!.creditCount ?? "1", 10);
      const actorId = session.metadata!.actorId ?? "system";

      const alreadyProcessed = await prisma.candidateCredit.findFirst({
        where: { orgId: orgId!, note: { contains: sessionId } },
        select: { id: true },
      });

      if (!alreadyProcessed) {
        const label = CREDIT_LABELS[creditCount] ?? `${creditCount}× jelölt értékelés`;
        await addCredits({
          orgId: orgId!,
          amount: creditCount,
          actorId,
          note: `${label} [${sessionId}]`,
        });
      }
    }

    if (isCandidateAddon && orgId) {
      return (
        <div className="min-h-dvh bg-[#faf9f6] flex items-center justify-center">
          <div className="max-w-md text-center px-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(26,92,58,0.08)]">
              <span className="text-3xl text-[#1a5c3a]">✓</span>
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-2">
              // siker
            </p>
            <h1 className="font-playfair text-2xl text-[#1a1814] mb-3">
              {isHu ? "Köszönjük!" : "Thank you!"}
            </h1>
            <p className="text-sm text-[#7a756e] mb-6">
              {isHu
                ? "A jelölt kreditek sikeresen hozzáadva. Most már meghívhatod a következő jelölteket."
                : "Candidate credits have been added. You can now invite new candidates."}
            </p>
            <Link
              href={`/hiring/${orgId}`}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white hover:bg-[#a8340a] transition"
            >
              {isHu ? "Vissza a felvételhez →" : "Back to hiring →"}
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-dvh bg-[#faf9f6] flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(26,92,58,0.08)]">
            <span className="text-3xl text-[#1a5c3a]">✓</span>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-2">
            // siker
          </p>
          <h1 className="font-playfair text-2xl text-[#1a1814] mb-3">
            {isHu ? "Köszönjük!" : "Thank you!"}
          </h1>
          <p className="text-sm text-[#7a756e] mb-6">
            {isHu
              ? "Az előfizetés aktiválva. A csapatod most már hozzáfér az összes funkcióhoz."
              : "Your subscription is now active. Your team has access to all features."}
          </p>
          <Link
            href="/profile/results"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white hover:bg-[#a8340a] transition"
          >
            {isHu ? "Vissza a vezérlőpulthoz →" : "Go to dashboard →"}
          </Link>
        </div>
      </div>
    );
  }

  // Expired or unknown state
  return (
    <div className="min-h-dvh bg-[#faf9f6] flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        <h1 className="font-playfair text-2xl text-[#1a1814] mb-3">
          {isHu ? "A munkamenet lejárt" : "Session expired"}
        </h1>
        <p className="text-sm text-[#7a756e] mb-6">
          {isHu
            ? "Kérjük, próbáld újra az előfizetés aktiválását."
            : "Please try activating your subscription again."}
        </p>
        <Link
          href="/billing/checkout"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white hover:bg-[#a8340a] transition"
        >
          {isHu ? "Újrapróbálás" : "Try again"}
        </Link>
      </div>
    </div>
  );
}
