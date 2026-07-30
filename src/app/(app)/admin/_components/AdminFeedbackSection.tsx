import { featureInterestLabel } from "@/lib/feature-interest";

// Visszajelzések admin-nézet: szerep-kalibráció (RoleFitFeedback aggregát)
// + érdeklődés-jelzések (FeatureInterest). Szerver-komponens, csak megjelenít.

export interface RoleFitAggregate {
  /** O*NET-SOC kód (v2), vagy a régi „iparág:szerep" kulcs */
  occupationId: string;
  /** megjelenítendő név — a szerver oldja fel a katalógusból */
  label: string;
  accurate: number;
  inaccurate: number;
  avgFitScore: number;
  /** Wilson-féle 95%-os alsó korlát a találati arányra, százalékban */
  wilsonLow: number | null;
  /** elég mintán a véletlen alatt teljesít → a cél-profil felülvizsgálandó */
  belowChance: boolean;
}

export interface InterestRow {
  id: string;
  featureKey: string;
  createdAt: string;
  email: string | null;
  username: string | null;
}

export interface SatisfactionSummary {
  count: number;
  avgAgreement: number;
  avgObserverUsefulness: number;
  avgSiteUsefulness: number;
}

export interface DimensionAverage {
  dimensionCode: string;
  avgRating: number;
  count: number;
}

export function AdminFeedbackSection({
  roleFitAggregates,
  interests,
  satisfactionSummary,
  dimensionAverages,
}: {
  roleFitAggregates: RoleFitAggregate[];
  interests: InterestRow[];
  satisfactionSummary: SatisfactionSummary;
  dimensionAverages: DimensionAverage[];
}) {
  const totalVotes = roleFitAggregates.reduce(
    (sum, r) => sum + r.accurate + r.inaccurate,
    0,
  );

  return (
    <div className="mt-8 flex flex-col gap-8">
      {/* Elégedettség + dimenzió-pontosság (a megszűnt Kutatás fülről) */}
      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {"// elégedettség"}
        </p>
        <h2 className="mt-1 font-fraunces text-xl text-ink">
          Kitöltés utáni visszajelzések ({satisfactionSummary.count})
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-sand bg-cream p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Egyetértés (átl.)
            </p>
            <p className="mt-2 text-2xl font-bold text-ink">
              {satisfactionSummary.avgAgreement}/5
            </p>
          </div>
          <div className="rounded-lg border border-sand bg-cream p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Observer-visszajelzés haszna (átl.)
            </p>
            <p className="mt-2 text-2xl font-bold text-ink">
              {satisfactionSummary.avgObserverUsefulness}/5
            </p>
          </div>
          <div className="rounded-lg border border-sand bg-cream p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Oldal haszna (átl.)
            </p>
            <p className="mt-2 text-2xl font-bold text-ink">
              {satisfactionSummary.avgSiteUsefulness}/5
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
            Dimenzió-pontosság — HEXACO
          </h3>
          <div className="space-y-2">
            {dimensionAverages.length > 0 ? (
              dimensionAverages.map((dim) => (
                <div
                  key={dim.dimensionCode}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-ink-body">{dim.dimensionCode}</span>
                  <span className="text-ink">
                    {dim.avgRating}/5{" "}
                    <span className="text-muted">({dim.count})</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">Még nincs visszajelzés.</p>
            )}
          </div>
        </div>
      </section>
      {/* Szerep-kalibráció */}
      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {"// szerep-kalibráció"}
        </p>
        <h2 className="mt-1 font-fraunces text-xl text-ink">
          Karrier-iránytű visszajelzések ({totalVotes} szavazat)
        </h2>
        <p className="mt-1 text-xs text-ink-body">
          „Dolgoztál hasonló szerepben — találó?” válaszok foglalkozásonként. Ahol a
          nem-találó arány magas, ott a katalógus cél-profilját érdemes
          felülvizsgálni (src/lib/career/catalog/). A „régi katalógus” jelölésű
          sorok a v1 motor idejéből valók, más azonosító-térrel.
        </p>

        {roleFitAggregates.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Még nincs visszajelzés.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sand font-mono text-micro uppercase tracking-widest text-muted">
                  <th className="py-2 pr-4">Szerep</th>
                  <th className="py-2 pr-4">Találó</th>
                  <th className="py-2 pr-4">Nem találó</th>
                  <th className="py-2 pr-4">Pontosság</th>
                  <th className="py-2 pr-4">Wilson-alsó</th>
                  <th className="py-2">Átl. illeszkedés</th>
                </tr>
              </thead>
              <tbody>
                {roleFitAggregates.map((row) => {
                  const total = row.accurate + row.inaccurate;
                  const accuracy = total > 0 ? Math.round((row.accurate / total) * 100) : 0;
                  return (
                    <tr key={row.occupationId} className="border-b border-sand/60">
                      <td className="py-2 pr-4 text-ink">{row.label}</td>
                      <td className="py-2 pr-4 text-emerald-700">{row.accurate}</td>
                      <td className="py-2 pr-4 text-rose-600">{row.inaccurate}</td>
                      <td className={`py-2 pr-4 font-mono ${row.belowChance ? "font-semibold text-amber-700" : "text-ink"}`}>
                        {accuracy}%
                        {row.belowChance && " ⚠"}
                      </td>
                      <td
                        className="py-2 pr-4 font-mono text-ink-body"
                        title="A találati arány 95%-os alsó korlátja — kis mintánál ez a becsületes szám."
                      >
                        {row.wilsonLow === null ? "—" : `${row.wilsonLow}%`}
                      </td>
                      <td className="py-2 font-mono text-ink-body">{row.avgFitScore}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Érdeklődés-jelzések */}
      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {"// érdeklődés-jelzések"}
        </p>
        <h2 className="mt-1 font-fraunces text-xl text-ink">
          Lead-ek és javaslatok ({interests.length})
        </h2>
        <p className="mt-1 text-xs text-ink-body">
          A szöveges üzenetek emailben mentek ({process.env.CONTACT_FORM_TO ?? "info@trita.io"})
          — itt a ki/mit/mikor látszik.
        </p>

        {interests.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Még nincs jelzés.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sand font-mono text-micro uppercase tracking-widest text-muted">
                  <th className="py-2 pr-4">Típus</th>
                  <th className="py-2 pr-4">Felhasználó</th>
                  <th className="py-2">Mikor</th>
                </tr>
              </thead>
              <tbody>
                {interests.map((row) => (
                  <tr key={row.id} className="border-b border-sand/60">
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          row.featureKey === "team"
                            ? "bg-sage/10 text-sage-dark"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {featureInterestLabel(row.featureKey)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-ink">
                      {row.username ?? "—"}
                      <span className="ml-2 text-xs text-muted">{row.email ?? ""}</span>
                    </td>
                    <td className="py-2 text-xs text-ink-body">
                      {new Date(row.createdAt).toLocaleString("hu-HU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
