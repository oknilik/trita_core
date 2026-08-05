import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { CAREER_FAKE_DOOR_MODULE, formatPrice } from "@/lib/fakedoor/career";
import { buildFakeDoorReport, type FakeDoorCell } from "@/lib/fakedoor/report";

// Karrier fake door riport (T17).
//
// Miért külön oldal és nem az admin visszajelzés-fül egy blokkja: itt minden
// szám SZEGMENTÁLT. Egy összevont konverzió a tanácsadói és az egyéni
// válaszokat keverné, az ársávokat pedig egymásra mosná — pont azt a két
// dolgot, amiért a mérés készült.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Karrier fake door | trita admin",
  robots: { index: false, follow: false },
};

const AUDIENCE_LABEL: Record<string, string> = {
  individual: "Egyéni",
  candidate: "Jelölt",
  consultant: "Tanácsadó",
  anon: "Nem azonosított",
};

const GOAL_LABEL: Record<string, string> = {
  fit: "Milyen munkák illenek hozzám",
  switch: "Pályaváltás előtt dönteni",
  interview: "Interjúra felkészülni",
  confirm: "Megerősítés, hogy jó helyen vagyok",
  other: "Egyéb",
  skipped: "Átugrotta",
};

const REASON_LABEL: Record<string, string> = {
  price: "Drágának tartja",
  accuracy: "Nem hiszi, hogy pontos",
  no_need: "Most nincs karrierkérdése",
  other: "Egyéb",
  skipped: "Átugrotta",
};

function pct(value: number | null): string {
  return value == null ? "—" : `${value}%`;
}

function CellRow({ label, cell }: { label: string; cell: FakeDoorCell }) {
  return (
    <tr className="border-t border-sand">
      <td className="py-2 pr-3 font-medium text-ink">{label}</td>
      <td className="py-2 pr-3 text-right tabular-nums text-ink-body">{cell.views}</td>
      <td className="py-2 pr-3 text-right tabular-nums text-ink-body">{cell.responses}</td>
      <td className="py-2 pr-3 text-right tabular-nums font-semibold text-ink">
        {pct(cell.responseRate)}
      </td>
      <td className="py-2 pr-3 text-right tabular-nums text-ink-body">{cell.yes}</td>
      <td className="py-2 pr-3 text-right tabular-nums font-semibold text-ink">
        {pct(cell.yesRate)}
      </td>
      <td className="py-2 pr-3 text-right tabular-nums text-ink-body">{cell.emails}</td>
      <td className="py-2 text-right tabular-nums text-ink-body">{pct(cell.emailRate)}</td>
    </tr>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left font-mono text-xs uppercase tracking-widest text-muted">
            <th className="pb-2 pr-3">Szegmens</th>
            <th className="pb-2 pr-3 text-right">Megnyitás</th>
            <th className="pb-2 pr-3 text-right">Válasz</th>
            <th className="pb-2 pr-3 text-right">Válaszarány</th>
            <th className="pb-2 pr-3 text-right">Igen</th>
            <th className="pb-2 pr-3 text-right">Igen-arány</th>
            <th className="pb-2 pr-3 text-right">E-mail</th>
            <th className="pb-2 text-right">E-mail/igen</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Distribution({
  title,
  rows,
  labels,
  total,
}: {
  title: string;
  rows: { key: string; count: number }[];
  labels: Record<string, string>;
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
      <h2 className="font-fraunces text-lg text-ink">{title}</h2>
      <ul className="mt-3 flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink-body">{labels[row.key] ?? row.key}</span>
            <span className="tabular-nums font-semibold text-ink">
              {row.count}
              {total > 0 && (
                <span className="ml-2 font-normal text-muted">
                  {Math.round((row.count / total) * 100)}%
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function CareerFakeDoorReportPage() {
  await requireAdmin();
  const report = await buildFakeDoorReport(CAREER_FAKE_DOOR_MODULE);

  const goalTotal = report.valueGoals.reduce((sum, row) => sum + row.count, 0);
  const reasonTotal = report.noReasons.reduce((sum, row) => sum + row.count, 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <SectionEyebrow>
          kereslet-mérés
        </SectionEyebrow>
        <h1 className="mt-1 font-fraunces text-2xl text-ink">
          Karrier-iránytű — fake door
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-body">
          A funkció nem létezik. Ezek a számok azt mérik, érdemes-e megépíteni.
          A kimondott szándék nem fizetés: a tényleges vásárlási arány
          jellemzően ennél jóval alacsonyabb, ezért a számok irányt mutatnak,
          nem bevételt.
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <Link href="/admin?tab=feedback" className="text-bronze underline underline-offset-2">
            ← Admin
          </Link>
          <a
            href="/api/admin/fakedoor/career/export"
            className="text-bronze underline underline-offset-2"
          >
            Nyers export (CSV)
          </a>
        </div>
      </header>

      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <h2 className="font-fraunces text-lg text-ink">Közönség szerint</h2>
        <p className="mt-1 text-xs text-muted">
          A tanácsadói válasz más terméket értékel (ügyfélnek venné, nem
          magának) — ezért külön sor, nem beolvasztva.
        </p>
        <div className="mt-4">
          <Table>
            <CellRow label="Összesen" cell={report.total} />
            {report.byAudience
              .filter((row) => row.cell.views > 0 || row.cell.responses > 0)
              .map((row) => (
                <CellRow
                  key={row.audience}
                  label={AUDIENCE_LABEL[row.audience] ?? row.audience}
                  cell={row.cell}
                />
              ))}
          </Table>
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <h2 className="font-fraunces text-lg text-ink">Ársávok</h2>
        <p className="mt-1 text-xs text-muted">
          A sáv munkamenetenként sorsolódik, és visszatéréskor sem változik.
          Az „egyéni” metszet a döntéshez a lényeg — a keresleti görbe töréspontja.
        </p>
        <div className="mt-4">
          <Table>
            {report.byPrice.map((row) => (
              <CellRow key={row.price} label={formatPrice(row.price, "hu")} cell={row.cell} />
            ))}
          </Table>
        </div>
        <h3 className="mt-6 font-fraunces text-base text-ink">Csak egyéni vevők</h3>
        <div className="mt-2">
          <Table>
            {report.individualByPrice.map((row) => (
              <CellRow
                key={row.price}
                label={formatPrice(row.price, "hu")}
                cell={row.cell}
              />
            ))}
          </Table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Distribution
          title={'Mit oldana meg — „igen” ág'}
          rows={report.valueGoals}
          labels={GOAL_LABEL}
          total={goalTotal}
        />
        <Distribution
          title={'Mi tartja vissza — „nem” ág'}
          rows={report.noReasons}
          labels={REASON_LABEL}
          total={reasonTotal}
        />
      </div>

      {/* Fizetési hajlandóság: az „ár" ok önmagában nem termékdöntés — az
          összeg az. A csúszka mindig a LÁTOTT árról indul, ezért a „hányad
          része" oszlop az, ami az ársávok között összemérhető. */}
      {report.willingness.count > 0 && (
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-fraunces text-lg text-ink">
            Mennyit adnának érte — akiknek drága ({report.willingness.count})
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-sand bg-cream p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Medián
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
                {report.willingness.median == null
                  ? "—"
                  : formatPrice(report.willingness.median, "hu")}
              </p>
            </div>
            <div className="rounded-lg border border-sand bg-cream p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Átlag
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
                {report.willingness.average == null
                  ? "—"
                  : formatPrice(report.willingness.average, "hu")}
              </p>
            </div>
            <div className="rounded-lg border border-sand bg-cream p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                A látott ár hányada
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
                {report.willingness.medianShareOfShownPrice == null
                  ? "—"
                  : `${report.willingness.medianShareOfShownPrice}%`}
              </p>
            </div>
            <div className="rounded-lg border border-sand bg-cream p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Semennyit
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
                {report.willingness.zero}
              </p>
            </div>
          </div>

          {report.willingness.values.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1.5">
              {report.willingness.values.map((row) => (
                <li
                  key={row.amount}
                  className="flex items-baseline justify-between gap-3 border-t border-sand pt-1.5 text-sm first:border-t-0"
                >
                  <span className="tabular-nums text-ink-body">
                    {row.amount === 0 ? "Semennyit" : formatPrice(row.amount, "hu")}
                  </span>
                  <span className="tabular-nums font-semibold text-ink">{row.count}</span>
                </li>
              ))}
            </ul>
          )}

          {report.willingness.answered < report.willingness.count && (
            <p className="mt-3 text-xs text-muted">
              {report.willingness.count - report.willingness.answered} válaszadó
              nem mozdította a csúszkát (átugorta a kérdést).
            </p>
          )}
        </section>
      )}

      {report.otherTexts.length > 0 && (
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-fraunces text-lg text-ink">
            Szabad szöveges válaszok ({report.otherTexts.length})
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {report.otherTexts.map((row, index) => (
              <li key={index} className="border-t border-sand pt-2 text-sm text-ink-body">
                <span className="font-mono text-xs uppercase tracking-widest text-muted">
                  {row.interest === "yes" ? "igen" : "nem"} ·{" "}
                  {AUDIENCE_LABEL[row.audience] ?? row.audience}
                </span>
                <p className="mt-1">{row.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
