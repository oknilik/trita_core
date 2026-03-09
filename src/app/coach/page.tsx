import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { CoachInviteForm } from "@/components/coach/CoachInviteForm";

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

  const coach = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      role: true,
      username: true,
      email: true,
      coachProfile: { select: { maxClientSlots: true } },
    },
  });

  if (!coach || coach.role !== "COACH") redirect("/dashboard");

  const relationships = await prisma.coachClientRelationship.findMany({
    where: { coachId: coach.id, status: "ACTIVE" },
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

  const maxSlots = coach.coachProfile?.maxClientSlots ?? 10;
  const displayName = coach.username ?? coach.email ?? "Coach";
  const isHu = locale !== "en" && locale !== "de";

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">

        {/* Header */}
        <section className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Coach
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {isHu ? `Üdv, ${displayName}!` : `Welcome, ${displayName}!`}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isHu
              ? `${relationships.length} aktív kliens / ${maxSlots} hely`
              : `${relationships.length} active clients / ${maxSlots} slots`}
          </p>
        </section>

        {/* Invite new client */}
        <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {isHu ? "Kliens meghívása" : "Invite a client"}
          </h2>
          <CoachInviteForm locale={locale} />
        </section>

        {/* Client list */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isHu ? "Kliensek" : "Clients"}{" "}
            <span className="text-sm font-normal text-gray-500">({relationships.length})</span>
          </h2>

          {relationships.length === 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center text-sm text-gray-500">
              {isHu
                ? "Még nincs aktív kliensed. Hívj meg valakit fentebb!"
                : "No active clients yet. Invite someone above!"}
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
                  href={`/coach/clients/${client.id}`}
                  className="group rounded-xl border border-gray-100 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {client.username ?? client.email}
                      </p>
                      {client.username && (
                        <p className="text-xs text-gray-500">{client.email}</p>
                      )}
                    </div>
                    {assessment && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                        {assessment.testType === "HEXACO_MODIFIED"
                          ? "HEXACO"
                          : assessment.testType === "BIG_FIVE"
                          ? "BIG 5"
                          : assessment.testType}
                      </span>
                    )}
                  </div>

                  {/* Mini score bars */}
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
                                className="h-full rounded-full transition-all"
                                style={{ width: `${score}%`, backgroundColor: color }}
                              />
                            </div>
                            <span className="w-7 text-right text-[10px] text-gray-500">{score}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-gray-400">
                      {isHu ? "Még nincs assessment" : "No assessment yet"}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-gray-400">
                    {isHu ? "Kliens óta: " : "Client since: "}
                    {rel.startedAt.toLocaleDateString(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU")}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
