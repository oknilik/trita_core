import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { FadeIn } from "@/components/landing/FadeIn";
import { CandidateInviteForm } from "@/components/manager/CandidateInviteForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Candidates | Trita", robots: { index: false } };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export default async function CandidatesPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!manager || manager.role !== "MANAGER") redirect("/dashboard");

  const [invites, teams] = await Promise.all([
    prisma.candidateInvite.findMany({
      where: { managerId: manager.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        email: true,
        name: true,
        position: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        completedAt: true,
        team: { select: { id: true, name: true } },
        result: { select: { id: true } },
      },
    }),
    prisma.team.findMany({
      where: { ownerId: manager.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const isHu = locale !== "en" && locale !== "de";
  const dateLocale = locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU";

  function statusLabel(status: string): string {
    if (isHu) {
      return status === "PENDING" ? "Függőben" : status === "COMPLETED" ? "Kész" : "Lejárt";
    }
    return status === "PENDING" ? "Pending" : status === "COMPLETED" ? "Completed" : "Expired";
  }

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Header */}
        <FadeIn>
          <div>
            <Link
              href="/manager"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-6"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              {isHu ? "Vissza a dashboardra" : "Back to dashboard"}
            </Link>

            <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" aria-hidden="true" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {isHu ? "Toborzás" : "Hiring"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                    {isHu ? "Jelöltek" : "Candidates"}
                  </h1>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {invites.length}{" "}
                  {isHu
                    ? `meghívó · ${invites.filter((i) => i.status === "COMPLETED").length} kitöltve`
                    : `invite${invites.length !== 1 ? "s" : ""} · ${invites.filter((i) => i.status === "COMPLETED").length} completed`}
                </p>
              </div>
            </section>
          </div>
        </FadeIn>

        {/* Create invite form */}
        <FadeIn delay={0.05}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Új meghívó" : "New invite"}
              </h2>
            </div>
            <p className="mb-5 text-sm text-gray-500">
              {isHu
                ? "Hozz létre egy értékelési linket, amelyet a jelöltnek küldhetsz. Regisztráció nélkül kitölthető."
                : "Create an assessment link to send to a candidate. No registration required on their end."}
            </p>
            <CandidateInviteForm locale={locale} teams={teams} />
          </section>
        </FadeIn>

        {/* Candidate list */}
        <FadeIn delay={0.1}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Meghívók" : "Invites"}{" "}
                <span className="text-sm font-normal text-gray-400">({invites.length})</span>
              </h2>
            </div>

            {invites.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-10 text-center">
                <p className="text-sm text-gray-400">
                  {isHu
                    ? "Még nincs meghívó. Hozz létre egyet fentebb!"
                    : "No invites yet. Create one above!"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {invites.map((invite) => {
                  const isCompleted = invite.status === "COMPLETED";
                  const isExpired = invite.status !== "COMPLETED" && invite.expiresAt < new Date();
                  const displayStatus = isExpired ? "EXPIRED" : invite.status;

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {invite.name ?? invite.email ?? (isHu ? "Névtelen jelölt" : "Anonymous candidate")}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {invite.position && (
                            <span className="text-xs text-gray-500">{invite.position}</span>
                          )}
                          {invite.team && (
                            <span className="text-xs text-gray-400">{invite.team.name}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {invite.createdAt.toLocaleDateString(dateLocale)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[displayStatus] ?? "bg-gray-100 text-gray-500"}`}
                        >
                          {statusLabel(displayStatus)}
                        </span>
                        {isCompleted && invite.result && (
                          <Link
                            href={`/manager/candidates/${invite.id}`}
                            className="min-h-[36px] rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 inline-flex items-center"
                          >
                            {isHu ? "Eredmény" : "Results"}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </FadeIn>

      </main>
    </div>
  );
}
