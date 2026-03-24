import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import type { ScoreResult } from "@/lib/scoring";
import type { TestType } from "@prisma/client";
import { getDimensionTier, getDimensionLabel } from "@/lib/dimension-utils";
import { estimateBelbinFromHexaco } from "@/lib/belbin-estimate";
import { BELBIN_ROLES, getTopRoles } from "@/lib/belbin-scoring";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Megosztott profil | trita",
  robots: { index: false },
};

function getInsight(
  score: number,
  insights: { low: string; mid: string; high: string },
): string {
  const range = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[range];
}

export default async function SharedProfilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getServerLocale();
  const isHu = locale === "hu";

  const result = await prisma.assessmentResult.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      scores: true,
      testType: true,
      createdAt: true,
      userProfile: {
        select: { username: true },
      },
    },
  });

  if (!result) notFound();

  const scores = result.scores as ScoreResult;
  if (scores.type !== "likert") notFound();

  const testType = result.testType as TestType;
  const config = getTestConfig(testType, locale);
  const displayName = result.userProfile?.username ?? (isHu ? "Felhasználó" : "User");

  const dimensions = config.dimensions
    .filter((d) => d.code !== "I")
    .map((dim) => {
      const score = scores.dimensions[dim.code] ?? 0;
      const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
        low: string; mid: string; high: string;
      };
      return {
        code: dim.code,
        label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
        score,
        insight: getInsight(score, insights),
        description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      };
    });

  const formattedDate = result.createdAt.toLocaleDateString(
    isHu ? "hu-HU" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  // Personality type
  const topTwo = [...dimensions].sort((a, b) => b.score - a.score).slice(0, 2);
  const typeLabels: Record<string, { hu: string; en: string }> = {
    H: { hu: "Elvi", en: "Principled" },
    E: { hu: "Érzékeny", en: "Sensitive" },
    X: { hu: "Energikus", en: "Energetic" },
    A: { hu: "Együttműködő", en: "Cooperative" },
    C: { hu: "Rendszerező", en: "Systematic" },
    O: { hu: "Innovátor", en: "Innovator" },
  };
  const personalityType = topTwo.length >= 2
    ? `${typeLabels[topTwo[0].code]?.[isHu ? "hu" : "en"] ?? ""} ${typeLabels[topTwo[1].code]?.[isHu ? "hu" : "en"] ?? ""}`
    : "";

  // Belbin
  const hexScores = Object.fromEntries(dimensions.map((d) => [d.code, d.score]));
  const hasBelbin = "H" in hexScores && "X" in hexScores;
  const belbinTop3 = hasBelbin
    ? getTopRoles(estimateBelbinFromHexaco(hexScores as Record<"H" | "E" | "X" | "A" | "C" | "O", number>), 3)
    : [];

  const rankLabels = [
    { hu: "Elsődleges", en: "Primary" },
    { hu: "Másodlagos", en: "Secondary" },
    { hu: "Harmadik", en: "Tertiary" },
  ];

  return (
    <main className="min-h-dvh bg-cream">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, #2a5244 0%, #1e3d34 60%, #1a2e28 100%)" }}
        >
          <div className="px-9 pb-7 pt-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.02]" />
            <p className="mb-1.5 text-[9px] uppercase tracking-[2px] text-white/[0.28]">
              {isHu ? "Megosztott profil" : "Shared profile"}
            </p>
            <h1 className="mb-0.5 font-fraunces text-[28px] tracking-tight text-white">
              {displayName}
            </h1>
            <p className="mb-3 text-[11px] text-white/[0.25]">
              {isHu ? "Felmérés:" : "Assessment:"} {formattedDate}
            </p>
            {personalityType && (
              <p className="font-fraunces text-[18px] italic text-[#e8a96a]">
                {personalityType}
              </p>
            )}
          </div>
        </div>

        {/* Dimension strip */}
        <div className="w-full overflow-hidden rounded-xl border border-[#e8e0d3] bg-white">
          <div className="grid grid-cols-6">
            {dimensions.map((dim, i) => {
              const tier = getDimensionTier(dim.score);
              const tierColor = tier === "high" ? "#3d6b5e" : tier === "mid" ? "#c17f4a" : "#8a8a9a";
              const tierBg = tier === "high" ? "#e8f2f0" : tier === "mid" ? "#fdf5ee" : "#f2ede6";
              return (
                <div
                  key={dim.code}
                  className={`px-2.5 py-4 text-center ${i < dimensions.length - 1 ? "border-r border-[#e8e0d3]" : ""}`}
                >
                  <p className="mb-1.5 text-[10px] text-[#8a8a9a]">
                    {dim.label.length > 10 ? dim.label.slice(0, 10) + "." : dim.label}
                  </p>
                  <p className="mb-1.5 font-fraunces text-[22px] leading-none" style={{ color: tierColor }}>
                    {dim.score}
                  </p>
                  <span
                    className="inline-block rounded px-[7px] py-[2px] text-[8px] font-semibold"
                    style={{ backgroundColor: tierBg, color: tierColor }}
                  >
                    {getDimensionLabel(dim.score, locale)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dimension details */}
        <div className="flex flex-col gap-3">
          {dimensions.map((dim) => {
            const tier = getDimensionTier(dim.score);
            const tierColor = tier === "high" ? "#3d6b5e" : tier === "mid" ? "#c17f4a" : "#8a8a9a";
            const cardBg = tier === "high" ? "#e8f2f0" : tier === "mid" ? "#fdf5ee" : "white";
            const borderColor = tier === "high" ? "rgba(61,107,94,0.22)" : tier === "mid" ? "rgba(193,127,74,0.18)" : "#e8e0d3";
            return (
              <div
                key={dim.code}
                className="rounded-[14px] p-4 px-[18px]"
                style={{ backgroundColor: cardBg, border: `1.5px solid ${borderColor}` }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tierColor }} />
                    <span className="text-sm font-medium text-[#1a1a2e]">{dim.label}</span>
                  </div>
                  <span className="font-fraunces text-base" style={{ color: tierColor }}>{dim.score}%</span>
                </div>
                <p className="text-[13px] font-medium leading-[1.7] text-[#1a1a2e]">{dim.insight}</p>
              </div>
            );
          })}
        </div>

        {/* Belbin */}
        {belbinTop3.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-widest text-[#8a8a9a]">
              {isHu ? "Csapatszerepek (Belbin)" : "Team roles (Belbin)"}
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr]">
              {belbinTop3.map(({ role, score }, idx) => {
                const roleMeta = BELBIN_ROLES[role];
                const isPrimary = idx === 0;
                return (
                  <div
                    key={role}
                    className={`flex flex-col rounded-[14px] ${
                      isPrimary
                        ? "border-2 border-[#3d6b5e] bg-[#e8f2f0] p-[22px]"
                        : "border-[1.5px] border-[#e8e0d3] bg-white p-[18px]"
                    }`}
                  >
                    <span
                      className={`mb-2 self-start rounded px-[9px] py-[3px] text-[8px] font-bold uppercase tracking-wide ${
                        isPrimary
                          ? "bg-[#3d6b5e] text-white"
                          : idx === 1
                            ? "bg-[#fdf5ee] text-[#8a5530]"
                            : "bg-[#f2ede6] text-[#8a8a9a]"
                      }`}
                    >
                      {isHu ? rankLabels[idx].hu : rankLabels[idx].en} · {score}%
                    </span>
                    <p className={`font-fraunces text-[#1a1a2e] ${isPrimary ? "text-[19px]" : "text-[17px]"}`}>
                      {isHu ? roleMeta.hu : roleMeta.en}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="font-fraunces text-sm text-[#8a8a9a]">
            <span style={{ color: "#3d6b5e" }}>t</span>rit<span style={{ color: "#c17f4a" }}>a</span>
          </p>
          <p className="mt-1 text-[11px] text-[#8a8a9a]">
            {isHu ? "Személyiség és csapatintelligencia platform" : "Personality and team intelligence platform"}
          </p>
        </div>
      </div>
    </main>
  );
}
