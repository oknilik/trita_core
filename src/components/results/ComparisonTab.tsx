"use client";

import { useLocale } from "@/components/LocaleProvider";
import type { SerializedDimension } from "@/components/profile/ProfileTabs";

interface ComparisonTabProps {
  dimensions: SerializedDimension[];
  hasObserverData: boolean;
  observerCount: number;
}

// ─── Insight texts for gaps ──────────────────────────────────────────────────

const GAP_INSIGHTS: Record<string, { hu: string; en: string }> = {
  H_higher: { hu: "Mások őszintébbnek és alázatosabbnak látnak, mint ahogyan magad érzed.", en: "Others see you as more honest and humble than you feel yourself." },
  H_lower: { hu: "Az értékrended erősebb lehet, mint amennyire azt kifelé kommunikálod.", en: "Your value system may be stronger than what you communicate outwardly." },
  E_higher: { hu: "Mások érzékenyebbnek látnak, mint ahogyan te érzed magad. Ez stresszes helyzetben válhat láthatóvá.", en: "Others see you as more sensitive than you feel. This may become visible under stress." },
  E_lower: { hu: "Stabilabbnak tűnsz kifelé, mint amennyire azt belülről érzed.", en: "You appear more stable outwardly than you feel internally." },
  X_higher: { hu: "Mások energikusabbnak és társaságibbnak látnak.", en: "Others see you as more energetic and sociable." },
  X_lower: { hu: "Kifelé visszafogottabbnak tűnsz, mint amennyire belül energikus vagy.", en: "You appear more reserved outwardly than you feel inside." },
  A_higher: { hu: "Mások barátságosabbnak értékelnek, mint ahogy magad látod. Lehet, hogy a belső feszültséged kevésbé látszik kifelé.", en: "Others rate you as more agreeable than you see yourself. Your internal tension may be less visible." },
  A_lower: { hu: "Az egyenességed erősebben jön át kifelé, mint amennyire azt érzékeled.", en: "Your directness comes across more strongly than you realize." },
  C_higher: { hu: "Mások szervezettebbnek és megbízhatóbbnak látnak.", en: "Others see you as more organized and reliable." },
  C_lower: { hu: "A belső rendszered kevésbé látszik kifelé — lehet, hogy többet is kommunikálhatnál a módszertanodból.", en: "Your internal structure is less visible — you could communicate more about your methods." },
  O_higher: { hu: "Mások nyitottabbnak látnak az új ötletekre és tapasztalatokra.", en: "Others see you as more open to new ideas and experiences." },
  O_lower: { hu: "A belső kíváncsiságod kevésbé nyilvánvaló kifelé.", en: "Your inner curiosity is less obvious to others." },
};

// ─── Summary generation ──────────────────────────────────────────────────────

function getSummaryPoints(
  dims: { name: string; self: number; observer: number }[],
  isHu: boolean,
): string[] {
  const points: string[] = [];
  const matching = dims.filter((d) => Math.abs(d.self - d.observer) < 10);
  const differing = dims.filter((d) => Math.abs(d.self - d.observer) >= 10);

  if (matching.length >= 4) {
    points.push(
      isHu
        ? `${matching.length} dimenzióban az önképed és mások visszajelzése szinte azonos — reálisan látod magad.`
        : `In ${matching.length} dimensions your self-image and others' feedback are nearly identical — you see yourself realistically.`,
    );
  }

  for (const d of differing) {
    const dir = d.observer > d.self ? (isHu ? "erősebbnek" : "stronger") : (isHu ? "gyengébbnek" : "weaker");
    points.push(
      isHu
        ? `${d.name}: mások ${dir} látnak (±${Math.abs(d.self - d.observer)} pont eltérés).`
        : `${d.name}: others see you as ${dir} (±${Math.abs(d.self - d.observer)} point gap).`,
    );
  }

  if (differing.length === 0) {
    points.push(
      isHu
        ? "Ritka és értékes: az önképed szinte teljesen egyezik mások értékelésével."
        : "Rare and valuable: your self-image almost perfectly matches others' assessment.",
    );
  }

  return points;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ComparisonTab({
  dimensions,
  hasObserverData,
  observerCount,
}: ComparisonTabProps) {
  const { locale } = useLocale();
  const isHu = locale === "hu";

  const mainDims = dimensions.filter((d) => d.code !== "I");

  const dimData = mainDims.map((d) => ({
    code: d.code,
    name: d.label,
    self: d.score,
    observer: d.observerScore ?? d.score,
  }));

  const matchingCount = dimData.filter((d) => Math.abs(d.self - d.observer) < 10).length;
  const differingCount = dimData.length - matchingCount;
  const avgGapPct = Math.round(
    dimData.reduce((sum, d) => sum + Math.abs(d.self - d.observer), 0) / (dimData.length || 1),
  );
  const isGoodMatch = differingCount <= 2;

  const blindspots = dimData.filter((d) => Math.abs(d.self - d.observer) >= 10);
  const noBlindspotDims = dimData.filter((d) => Math.abs(d.self - d.observer) < 10).map((d) => d.name);

  const summaryPoints = getSummaryPoints(dimData, isHu);

  const getInsight = (code: string, self: number, observer: number): string | null => {
    const gap = Math.abs(self - observer);
    if (gap < 10) return null;
    const dir = observer > self ? "higher" : "lower";
    const key = `${code}_${dir}`;
    return GAP_INSIGHTS[key]?.[isHu ? "hu" : "en"] ?? null;
  };

  if (!hasObserverData) {
    return (
      <div className="rounded-2xl border-[1.5px] border-[#ddd5c8] bg-[#f2ede6] p-8 text-center">
        <span className="mb-2.5 inline-block text-[32px] opacity-20">📊</span>
        <h3 className="mb-1.5 font-fraunces text-[18px] text-[#1a1a2e]">
          {isHu ? "Összehasonlítás" : "Comparison"}
        </h3>
        <p className="mx-auto max-w-[380px] text-[13px] leading-relaxed text-[#8a8a9a]">
          {isHu
            ? "Legalább 2 observer visszajelzés szükséges az összehasonlításhoz. Küldj meghívókat a Meghívók tabon."
            : "At least 2 observer responses are needed for comparison. Send invitations on the Invitations tab."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#3d6b5e" }} />
          <span className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
            {isHu ? "Önkép vs. Visszajelzés" : "Self vs. Feedback"}
          </span>
        </div>
        <h2 className="font-fraunces text-[22px] tracking-tight text-[#1a1a2e]">
          {isHu ? "Hogyan látnak mások?" : "How do others see you?"}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#8a8a9a]">
          {isHu
            ? "Az önértékelésed összehasonlítása a visszajelzésekkel — dimenzióról dimenzióra."
            : "Comparing your self-assessment with feedback — dimension by dimension."}
        </p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#e8f2f0] px-2.5 py-0.5 text-[11px] font-medium text-[#1e3d34]">
          {observerCount} {isHu ? "observer visszajelzés alapján" : "observer responses"}
        </span>
      </div>

      {/* 2. Overview card */}
      <div className="rounded-xl border-[1.5px] border-[#ddd5c8] bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{
              backgroundColor: isGoodMatch ? "#e8f2f0" : "#fdf5ee",
              color: isGoodMatch ? "#3d6b5e" : "#c17f4a",
            }}
          >
            {isGoodMatch ? "✓" : "⚠"}
          </div>
          <div>
            <p className="font-fraunces text-base text-[#1a1a2e]">
              {isGoodMatch
                ? (isHu ? "Összességében jó egyezés" : "Overall good match")
                : (isHu ? "Vegyes kép — van mit felfedezni" : "Mixed picture — worth exploring")}
            </p>
            <p className="text-xs leading-relaxed text-[#8a8a9a]">
              {isGoodMatch
                ? (isHu
                    ? "Az önképed és az observer visszajelzések a legtöbb dimenzióban közel azonosak. Ez ritka és értékes — azt jelenti, hogy reálisan látod magad."
                    : "Your self-image and observer feedback are close in most dimensions. This is rare and valuable — it means you see yourself realistically.")
                : (isHu
                    ? "Néhány dimenzióban jelentős eltérés van az önképed és mások visszajelzése között. Ez nem probléma — hanem lehetőség a mélyebb önismeretre."
                    : "There are significant differences in some dimensions. This isn't a problem — it's an opportunity for deeper self-awareness.")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-[10px] bg-[#f2ede6] p-3 text-center">
            <p className="font-fraunces text-[22px] leading-none" style={{ color: "#3d6b5e" }}>{matchingCount}</p>
            <p className="mt-1 text-[10px] text-[#8a8a9a]">{isHu ? "egyező dimenzió" : "matching dims"}</p>
          </div>
          <div className="rounded-[10px] bg-[#f2ede6] p-3 text-center">
            <p className="font-fraunces text-[22px] leading-none" style={{ color: "#c17f4a" }}>{differingCount}</p>
            <p className="mt-1 text-[10px] text-[#8a8a9a]">{isHu ? "eltérő dimenzió" : "differing dims"}</p>
          </div>
          <div className="rounded-[10px] bg-[#f2ede6] p-3 text-center">
            <p className="font-fraunces text-[22px] leading-none text-[#1a1a2e]">{avgGapPct}%</p>
            <p className="mt-1 text-[10px] text-[#8a8a9a]">{isHu ? "átlagos eltérés" : "avg. gap"}</p>
          </div>
        </div>
      </div>

      {/* 3. Dimension comparison cards */}
      <div>
        <div className="mb-4 flex gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-[#8a8a9a]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#3d6b5e" }} />
            {isHu ? "Önértékelés (Te)" : "Self-assessment (You)"}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#8a8a9a]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#e8a96a" }} />
            {isHu ? "Observer átlag (Mások)" : "Observer avg. (Others)"}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {dimData.map((dim) => {
            const gap = Math.abs(dim.self - dim.observer);
            const hasGap = gap >= 10;
            const insight = getInsight(dim.code, dim.self, dim.observer);

            return (
              <div
                key={dim.code}
                className={`rounded-xl border-[1.5px] p-4 px-[18px] ${
                  hasGap ? "border-[#c17f4a]/30 bg-[#fdf5ee]" : "border-[#3d6b5e]/20 bg-white"
                }`}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#1a1a2e]">{dim.name}</span>
                  <span
                    className="rounded px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: gap < 10 ? "#e8f2f0" : gap < 15 ? "#fdf5ee" : "#fef2f2",
                      color: gap < 10 ? "#1e3d34" : gap < 15 ? "#8a5530" : "#991b1b",
                    }}
                  >
                    ±{gap} {isHu ? "pont" : "pts"} — {gap < 10 ? (isHu ? "egyezik" : "match") : (isHu ? "eltérés" : "gap")}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-[50px] shrink-0 text-[10px] text-[#8a8a9a]">{isHu ? "Te" : "You"}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-[#e8e0d3]">
                      <div className="h-full rounded-sm" style={{ width: `${dim.self}%`, backgroundColor: "#3d6b5e" }} />
                    </div>
                    <span className="w-7 shrink-0 text-right text-[10px] font-semibold" style={{ color: "#3d6b5e" }}>{dim.self}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-[50px] shrink-0 text-[10px] text-[#8a8a9a]">{isHu ? "Mások" : "Others"}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-[#e8e0d3]">
                      <div className="h-full rounded-sm" style={{ width: `${dim.observer}%`, backgroundColor: "#e8a96a" }} />
                    </div>
                    <span className="w-7 shrink-0 text-right text-[10px] font-semibold" style={{ color: "#c17f4a" }}>{dim.observer}</span>
                  </div>
                </div>

                {hasGap && insight && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-[#f2ede6] p-2.5 px-3">
                    <span className="mt-px shrink-0 text-xs" style={{ color: "#c17f4a" }}>💡</span>
                    <span className="text-xs leading-relaxed text-[#4a4a5e]">{insight}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Blind spot analysis */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#3d6b5e" }} />
          <span className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
            {isHu ? "Vakfolt-elemzés" : "Blind spot analysis"}
          </span>
        </div>
        <h3 className="font-fraunces text-lg text-[#1a1a2e]">
          {isHu ? "Amit mások másképp látnak" : "What others see differently"}
        </h3>
        <p className="mb-3 mt-1 text-[13px] leading-relaxed text-[#8a8a9a]">
          {isHu
            ? "Olyan területek, ahol az önképed és mások visszajelzése között érdemi különbség van."
            : "Areas where your self-image and others' feedback differ meaningfully."}
        </p>

        <div className="flex flex-col gap-2.5">
          {blindspots.map((bs) => {
            const dir = bs.observer > bs.self;
            const insight = getInsight(bs.code, bs.self, bs.observer);
            return (
              <div key={bs.code} className="rounded-xl border-l-4 bg-[#fdf5ee] p-4 px-[18px]" style={{ borderLeftColor: "#c17f4a" }}>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#8a5530]">
                  {isHu ? "Lehetséges vakfolt" : "Possible blind spot"}
                </p>
                <p className="font-fraunces text-[15px] text-[#1a1a2e]">
                  {bs.name} — {dir
                    ? (isHu ? "mások erősebbnek látnak" : "others see you as stronger")
                    : (isHu ? "mások gyengébbnek látnak" : "others see you as weaker")}
                </p>
                {insight && (
                  <p className="mt-1 text-xs leading-relaxed text-[#4a4a5e]">{insight}</p>
                )}
                <div className="mt-2 flex gap-3">
                  <span className="flex items-center gap-1 text-[11px] text-[#8a8a9a]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#3d6b5e" }} />
                    {isHu ? "Önértékelés" : "Self"}: {bs.self}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#8a8a9a]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#e8a96a" }} />
                    Observer: {bs.observer}
                  </span>
                </div>
              </div>
            );
          })}

          {noBlindspotDims.length > 0 && (
            <div className="rounded-xl border-l-4 bg-[#e8f2f0] p-4 px-[18px]" style={{ borderLeftColor: "#3d6b5e" }}>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#1e3d34]">
                {isHu ? "Nincs vakfolt" : "No blind spot"}
              </p>
              <p className="font-fraunces text-[15px] text-[#1a1a2e]">
                {noBlindspotDims.join(", ")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#1e3d34]">
                {isHu
                  ? "Ezekben a dimenziókban az önképed és mások visszajelzése közel azonos — reálisan látod magad."
                  : "In these dimensions your self-image and others' feedback are nearly identical — you see yourself realistically."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Dark summary card */}
      <div
        className="rounded-2xl p-6 px-7"
        style={{ background: "linear-gradient(135deg, #1a1a2e, #2a2740)" }}
      >
        <p className="mb-2 text-[9px] uppercase tracking-widest" style={{ color: "#e8a96a" }}>
          {isHu ? "Összefoglaló" : "Summary"}
        </p>
        <p className="mb-3 font-fraunces text-lg text-white">
          {isHu ? "Amit érdemes megjegyezni" : "Worth noting"}
        </p>
        <div className="flex flex-col gap-2">
          {summaryPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#5a8f7f" }} />
              <p className="text-[13px] leading-[1.6] text-white/[0.55]">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
