import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { FadeIn } from "@/components/landing/FadeIn";
import { CoachInviteForm } from "@/components/manager/CoachInviteForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Coach Dashboard | Trita", robots: { index: false } };
}

const DIM_COLORS: Record<string, string> = {
  H: "#6366f1", E: "#a855f7", X: "#3b82f6",
  A: "#22c55e", C: "#f97316", O: "#ec4899",
  N: "#f43f5e",
};

export default async function CoachPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      role: true,
      username: true,
      email: true,
      coachProfile: { select: { maxClientSlots: true } },
    },
  });

  if (!manager || manager.role !== "MANAGER") redirect("/dashboard");

  const relationships = await prisma.managerClientRelationship.findMany({
    where: { managerId: manager.id, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      startedAt: true,
      client: {
        select: {
          id: true,
          email: true,
          username: true,
          assessmentResults: {
            where: { isSelfAssessment: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { testType: true, scores: true, createdAt: true },
          },
        },
      },
    },
  });

  const maxSlots = manager.coachProfile?.maxClientSlots ?? 10;
  const displayName = manager.username ?? manager.email ?? "Coach";
  const isHu = locale !== "en" && locale !== "de";

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Hero */}
        <FadeIn>
          <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40 md:p-12">
            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 via-purple-500/15 to-pink-500/15 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500/20 via-indigo-500/10 to-pink-500/10 blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                {isHu ? "HR & Csapat" : "HR & Team"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-4xl">
                  {isHu ? `Üdv, ${displayName}!` : `Welcome, ${displayName}!`}
                </h1>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {isHu
                  ? `${relationships.length} aktív kliens · ${maxSlots - relationships.length} szabad hely`
                  : `${relationships.length} active clients · ${maxSlots - relationships.length} slots available`}
              </p>
            </div>
          </section>
        </FadeIn>

        {/* Invite new client */}
        <FadeIn delay={0.05}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              {isHu ? "Kliens meghívása" : "Invite a client"}
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              {isHu
                ? "Add meg a kliens email címét — ha már regisztrált, azonnal hozzáadjuk."
                : "Enter the client's email — if they're registered, we'll add them right away."}
            </p>
            <CoachInviteForm locale={locale} />
          </section>
        </FadeIn>

        {/* Client list */}
        <FadeIn delay={0.1}>
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Kliensek" : "Clients"}{" "}
                <span className="text-sm font-normal text-gray-400">({relationships.length})</span>
              </h2>
            </div>

            {relationships.length === 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-10 text-center">
                <p className="text-sm text-gray-400">
                  {isHu
                    ? "Még nincs aktív kliensed. Hívj meg valakit fentebb!"
                    : "No active clients yet. Invite someone above!"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {relationships.map((rel) => {
                const client = rel.client;
                const assessment = client.assessmentResults[0];
                const scores = assessment
                  ? ((assessment.scores as Record<string, unknown>).dimensions as Record<string, number> | undefined)
                  : undefined;
                const testType = assessment?.testType as TestType | undefined;
                const config = testType ? getTestConfig(testType, locale) : null;
                const dims = config?.dimensions.filter((d) => d.code !== "I") ?? [];

                return (
                  <Link
                    key={rel.id}
                    href={`/manager/clients/${client.id}`}
                    className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                          {client.username ?? client.email}
                        </p>
                        {client.username && (
                          <p className="truncate text-xs text-gray-400">{client.email}</p>
                        )}
                      </div>
                      {assessment && (
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                          {assessment.testType === "HEXACO_MODIFIED"
                            ? "HEXACO"
                            : assessment.testType === "BIG_FIVE"
                            ? "BIG 5"
                            : assessment.testType}
                        </span>
                      )}
                    </div>

                    {scores && dims.length > 0 ? (
                      <div className="mt-4 flex flex-col gap-1.5">
                        {dims.map((dim) => {
                          const score = scores[dim.code] ?? 0;
                          const color = DIM_COLORS[dim.code] ?? "#6366f1";
                          return (
                            <div key={dim.code} className="flex items-center gap-2">
                              <span className="w-4 text-[10px] font-bold text-gray-400">{dim.code}</span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${score}%`, backgroundColor: color }}
                                />
                              </div>
                              <span className="w-7 text-right text-[10px] tabular-nums text-gray-400">{score}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-gray-400">
                        {isHu ? "Még nincs kitöltött assessment" : "No assessment yet"}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {isHu ? "Kliens óta: " : "Since "}
                        {rel.startedAt.toLocaleDateString(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU")}
                      </p>
                      <span className="text-xs font-semibold text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">
                        {isHu ? "Megnyitás →" : "Open →"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </FadeIn>

      </main>
    </div>
  );
}
