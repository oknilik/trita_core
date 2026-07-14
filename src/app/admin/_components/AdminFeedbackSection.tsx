import { INDUSTRIES } from "@/lib/industry-fit";

// Visszajelzések admin-nézet: szerep-kalibráció (RoleFitFeedback aggregát)
// + érdeklődés-jelzések (FeatureInterest). Szerver-komponens, csak megjelenít.

export interface RoleFitAggregate {
  industryKey: string;
  roleKey: string;
  accurate: number;
  inaccurate: number;
  avgFitScore: number;
}

export interface InterestRow {
  id: string;
  featureKey: string;
  createdAt: string;
  email: string | null;
  username: string | null;
}

const FEATURE_LABELS: Record<string, string> = {
  team: "Csapatelemzés-érdeklődés",
  industry_role: "Hiányzó szakma-javaslat",
};

function roleLabel(industryKey: string, roleKey: string): string {
  const industry = INDUSTRIES.find((i) => i.key === industryKey);
  const role = industry?.roles.find((r) => r.key === roleKey);
  if (!industry || !role) return `${industryKey}/${roleKey}`;
  return `${role.hu} · ${industry.hu}`;
}

export function AdminFeedbackSection({
  roleFitAggregates,
  interests,
}: {
  roleFitAggregates: RoleFitAggregate[];
  interests: InterestRow[];
}) {
  const totalVotes = roleFitAggregates.reduce(
    (sum, r) => sum + r.accurate + r.inaccurate,
    0,
  );

  return (
    <div className="mt-8 flex flex-col gap-8">
      {/* Szerep-kalibráció */}
      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {"// szerep-kalibráció"}
        </p>
        <h2 className="mt-1 font-fraunces text-xl text-ink">
          Karrier-iránytű visszajelzések ({totalVotes} szavazat)
        </h2>
        <p className="mt-1 text-xs text-ink-body">
          „Dolgoztál hasonló szerepben — találó?” válaszok szerepenként. Ahol a
          nem-találó arány magas, ott a súlyokat érdemes felülvizsgálni
          (src/lib/industry-fit.ts).
        </p>

        {roleFitAggregates.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Még nincs visszajelzés.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sand font-mono text-[10px] uppercase tracking-widest text-muted">
                  <th className="py-2 pr-4">Szerep</th>
                  <th className="py-2 pr-4">Találó</th>
                  <th className="py-2 pr-4">Nem találó</th>
                  <th className="py-2 pr-4">Pontosság</th>
                  <th className="py-2">Átl. illeszkedés</th>
                </tr>
              </thead>
              <tbody>
                {roleFitAggregates.map((row) => {
                  const total = row.accurate + row.inaccurate;
                  const accuracy = total > 0 ? Math.round((row.accurate / total) * 100) : 0;
                  return (
                    <tr key={`${row.industryKey}-${row.roleKey}`} className="border-b border-sand/60">
                      <td className="py-2 pr-4 text-ink">{roleLabel(row.industryKey, row.roleKey)}</td>
                      <td className="py-2 pr-4 text-emerald-700">{row.accurate}</td>
                      <td className="py-2 pr-4 text-rose-600">{row.inaccurate}</td>
                      <td className={`py-2 pr-4 font-mono ${accuracy < 60 && total >= 3 ? "font-semibold text-amber-700" : "text-ink"}`}>
                        {accuracy}%
                        {accuracy < 60 && total >= 3 && " ⚠"}
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
                <tr className="border-b border-sand font-mono text-[10px] uppercase tracking-widest text-muted">
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
                        {FEATURE_LABELS[row.featureKey] ?? row.featureKey}
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
