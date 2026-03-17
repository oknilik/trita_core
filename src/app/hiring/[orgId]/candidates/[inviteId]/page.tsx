import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Jelölt eredménye | Trita", robots: { index: false } };
}

const DIM_COLORS: Record<string, string> = {
  H: "#6366F1",
  E: "#8B5CF6",
  X: "#06B6D4",
  A: "#10B981",
  C: "#F59E0B",
  O: "#EF4444",
};

const DIM_LABELS_HU: Record<string, string> = {
  H: "Őszinteség-Alázat",
  E: "Érzelmi stabilitás",
  X: "Extraverzió",
  A: "Barátságosság",
  C: "Lelkiismeretesség",
  O: "Nyitottság",
};

const DIM_LABELS_EN: Record<string, string> = {
  H: "Honesty-Humility",
  E: "Emotionality",
  X: "eXtraversion",
  A: "Agreeableness",
  C: "Conscientiousness",
  O: "Openness",
};

export default async function CandidateResultPage({
  params,
}: {
  params: Promise<{ orgId: string; inviteId: string }>;
}) {
  const [locale, { orgId, inviteId }] = await Promise.all([
    getServerLocale(),
    params,
  ]);

  const { role: memberRole } = await requireOrgContext(orgId);
  if (!hasOrgRole(memberRole, "ORG_MANAGER")) notFound();

  const isHu = locale !== "en";
  const dimLabels = isHu ? DIM_LABELS_HU : DIM_LABELS_EN;

  const invite = await prisma.candidateInvite.findFirst({
    where: { id: inviteId, team: { orgId } },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      status: true,
      teamId: true,
      team: { select: { id: true, name: true } },
      result: { select: { scores: true, testType: true } },
    },
  });

  if (!invite || !invite.result) {
    redirect(`/hiring/${orgId}`);
  }

  const candidateScores = invite.result.scores as Record<string, number>;
  const dims = ["H", "E", "X", "A", "C", "O"];

  // Fetch team members' scores for comparison
  let teamAvg: Record<string, number> | null = null;
  if (invite.teamId) {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: invite.teamId },
      select: {
        user: {
          select: {
            assessmentResults: {
              where: { isSelfAssessment: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { scores: true },
            },
          },
        },
      },
    });

    const validScores: Record<string, number>[] = teamMembers
      .map((m) => m.user.assessmentResults[0]?.scores as Record<string, number> | undefined)
      .filter((s): s is Record<string, number> =>
        !!s && dims.every((d) => typeof s[d] === "number")
      );

    if (validScores.length >= 1) {
      const sums: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0 };
      for (const s of validScores) {
        for (const d of dims) sums[d] += s[d];
      }
      teamAvg = {};
      for (const d of dims) teamAvg[d] = Math.round(sums[d] / validScores.length);
    }
  }

  const displayName =
    invite.name ?? invite.email ?? (isHu ? "Névtelen jelölt" : "Unnamed candidate");

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        {/* Back */}
        <Link
          href={`/hiring/${orgId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] transition-colors hover:text-[#c8410a]"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {isHu ? "Vissza · Felvétel" : "Back · Hiring"}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// jelölt eredménye" : "// candidate result"}
          </p>
          <h1 className="mt-1 font-playfair text-3xl text-[#1a1814] md:text-4xl">
            {displayName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {invite.position && (
              <span className="text-sm text-[#5a5650]">{invite.position}</span>
            )}
            {invite.team && (
              <span className="text-xs text-[#a09a90]">
                {isHu ? "Csapat: " : "Team: "}{invite.team.name}
              </span>
            )}
          </div>
        </div>

        {/* HEXACO comparison */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// hexaco összehasonlítás" : "// hexaco comparison"}
          </p>
          <h2 className="mb-6 font-playfair text-xl text-[#1a1814]">
            {isHu ? "Személyiségprofil" : "Personality profile"}
          </h2>

          {/* Legend */}
          <div className="mb-5 flex flex-wrap items-center gap-4 text-[12px]">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#c8410a]" />
              <span className="text-[#3d3a35]">{displayName}</span>
            </div>
            {teamAvg && (
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#d3cfc6]" />
                <span className="text-[#3d3a35]">
                  {isHu ? "Csapatátlag" : "Team avg"}
                  {invite.team ? ` · ${invite.team.name}` : ""}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {dims.map((d) => {
              const candidateVal = Math.round(candidateScores[d] ?? 0);
              const teamVal = teamAvg ? Math.round(teamAvg[d]) : null;
              const color = DIM_COLORS[d];

              return (
                <div key={d} className="flex items-center gap-3">
                  <div
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[8px] font-bold text-white"
                    style={{ background: color }}
                  >
                    {d}
                  </div>
                  <span className="w-36 flex-shrink-0 truncate text-xs text-[#5a5650]">
                    {dimLabels[d]}
                  </span>
                  <div className="relative flex-1">
                    {/* Track */}
                    <div className="h-3 overflow-hidden rounded-full bg-[#f0ede6]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${candidateVal}%`, background: color, opacity: 0.85 }}
                      />
                    </div>
                    {/* Team avg marker */}
                    {teamVal !== null && (
                      <div
                        className="absolute top-0 h-3 w-0.5 rounded-full bg-[#3d3a35]/40"
                        style={{ left: `${teamVal}%` }}
                        title={`${isHu ? "Csapatátlag" : "Team avg"}: ${teamVal}`}
                      />
                    )}
                  </div>
                  <div className="flex w-16 flex-shrink-0 items-center gap-1 text-right">
                    <span className="flex-1 font-mono text-xs font-semibold text-[#1a1814]">
                      {candidateVal}
                    </span>
                    {teamVal !== null && (
                      <span className="font-mono text-[10px] text-[#a09a90]">
                        / {teamVal}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!teamAvg && invite.teamId && (
            <p className="mt-4 text-xs text-[#a09a90]">
              {isHu
                ? "A csapattagoknak nincs befejezett értékelése — összehasonlítás nem lehetséges."
                : "Team members have no completed assessments — comparison unavailable."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
