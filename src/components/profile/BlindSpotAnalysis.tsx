import type { Locale } from "@/lib/i18n";

interface DimGapEntry {
  code: string;
  label: string;
  color: string;
  selfScore: number;
  observerScore: number;
}

interface BlindSpotAnalysisProps {
  dimensions: DimGapEntry[];
  hasObserverData: boolean;
  locale: Locale;
}

export function BlindSpotAnalysis({
  dimensions,
  hasObserverData,
  locale,
}: BlindSpotAnalysisProps) {
  const isHu = locale === "hu";

  if (!hasObserverData) {
    return (
      <div className="rounded-2xl border border-[#e8e4dc] bg-[#faf9f6] px-6 py-8 text-center">
        <p className="text-sm text-[#5a5650]">
          {isHu
            ? "Observer adatok nélkül a vakfolt-elemzés nem elérhető."
            : "Blind spot analysis requires observer data."}
        </p>
      </div>
    );
  }

  const THRESHOLD = 12; // min delta to flag as meaningful

  const hiddenOnly = dimensions.filter(
    (d) => d.observerScore - d.selfScore >= THRESHOLD,
  );
  const overOnly = dimensions.filter(
    (d) => d.selfScore - d.observerScore >= THRESHOLD,
  );

  const hasAny = hiddenOnly.length > 0 || overOnly.length > 0;

  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-[#e8e4dc] bg-[#faf9f6] px-6 py-8 text-center">
        <p className="text-sm text-[#5a5650]">
          {isHu
            ? "Nincs szignifikáns vakfolt — az önképed és az observer visszajelzések jól egyeznek."
            : "No significant blind spots — your self-image aligns well with observer feedback."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden strengths — observer > self */}
      {hiddenOnly.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#1a5c3a]">
            {isHu
              ? "// erősségek, amiket nem látsz"
              : "// strengths you don't see in yourself"}
          </p>
          <div className="space-y-3">
            {hiddenOnly.map((dim) => (
              <div
                key={dim.code}
                className="flex items-start gap-4 rounded-xl border border-[#e8e4dc] bg-white p-4"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold text-white mt-0.5"
                  style={{ backgroundColor: dim.color }}
                >
                  {dim.code}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1814]">{dim.label}</p>
                  <p className="mt-0.5 text-xs text-[#5a5650]">
                    {isHu
                      ? `Mások +${dim.observerScore - dim.selfScore}%-kal magasabbra értékelik.`
                      : `Others rate this ${dim.observerScore - dim.selfScore}% higher than you do.`}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#3d3a35]">
                    {isHu
                      ? "Mások ezt erősségként látják benned — érdemes tudatosabban támaszkodni rá."
                      : "Others see this as a strength in you — worth leaning into more consciously."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overestimated — self > observer */}
      {overOnly.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
            {isHu
              ? "// figyelmet érdemlő területek"
              : "// areas worth more attention"}
          </p>
          <div className="space-y-3">
            {overOnly.map((dim) => (
              <div
                key={dim.code}
                className="flex items-start gap-4 rounded-xl border border-[#e8e4dc] bg-white p-4"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold text-white mt-0.5"
                  style={{ backgroundColor: dim.color }}
                >
                  {dim.code}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1814]">{dim.label}</p>
                  <p className="mt-0.5 text-xs text-[#5a5650]">
                    {isHu
                      ? `Te +${dim.selfScore - dim.observerScore}%-kal magasabbra értékeled, mint mások.`
                      : `You rate this ${dim.selfScore - dim.observerScore}% higher than observers do.`}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#3d3a35]">
                    {isHu
                      ? "Ez a terület nagyobb figyelmet érdemelhet — a visszajelzések eltérnek az önképedtől."
                      : "This area may deserve more attention — feedback diverges from your self-image."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
