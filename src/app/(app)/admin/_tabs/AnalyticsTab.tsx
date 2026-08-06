import { AdminStatCard } from "@/app/(app)/admin/_components/AdminStatCard";
import { AdminMetricsGrid } from "@/app/(app)/admin/_components/AdminMetricsGrid";
import { AdminTableSection } from "@/app/(app)/admin/_components/AdminTableSection";
import { AdminTrendChart } from "@/app/(app)/admin/_components/AdminTrendChart";
import { AdminRangeFilter, type AdminRange } from "@/app/(app)/admin/_components/AdminRangeFilter";
import { ANALYTICS_RETENTION_MONTHS } from "@/lib/analytics/retention";
import {
  buildDailyWindow,
  getAcquisitionFunnel,
  getAssessmentDropOff,
  getEventVolume,
  getRecentEvents,
  getStorageStats,
  getTopCampaigns,
  getTopPaths,
  getTopReferrers,
  getTrafficSummary,
} from "@/lib/analytics/queries";

/**
 * Analitika fül — a saját, first-party eseményrendszer kiértékelése.
 *
 * ALAPELV: a felület KÜLÖN mutatja az eseményből számolt (lossy) és a
 * DB-ből számolt (pontos) értéket. Nem gyúrjuk őket egyetlen számmá — a
 * hamis pontosság rosszabb, mint a látható eltérés, és az eltérés mértéke
 * maga is hasznos információ (mennyit visz el az ad-blocker és a
 * nyomkövetés-tiltás).
 *
 * HU-only, mint a többi admin-fül (AdminNav-precedens).
 */

const RANGE_DAYS: Record<AdminRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: 180,
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleString("hu-HU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-sand bg-white p-6">
      <div className="mb-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">{title}</h2>
        {description && <p className="mt-1 text-xs text-ink-body">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}

export async function AnalyticsTab({ range }: { range: AdminRange }) {
  const window = buildDailyWindow(RANGE_DAYS[range]);

  const [traffic, topPaths, referrers, campaigns, funnel, dropOff, volume, recent, storage] =
    await Promise.all([
      getTrafficSummary(window),
      getTopPaths(window),
      getTopReferrers(window),
      getTopCampaigns(window),
      getAcquisitionFunnel(window),
      getAssessmentDropOff(window),
      getEventVolume(window),
      getRecentEvents(20),
      getStorageStats(),
    ]);

  const firstFunnelValue = funnel[0]?.eventValue ?? null;

  return (
    <div className="space-y-6">
      <AdminRangeFilter active={range} tab="analytics" />

      {!traffic.hasData && (
        <div className="rounded-xl border border-bronze/40 bg-white p-6">
          <p className="text-sm font-semibold text-ink">Még nincs mérési adat</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-body">
            A rendszer él, de erre az időszakra nem érkezett esemény. Ellenőrizd, hogy az
            <code className="mx-1 rounded bg-cream px-1 py-0.5 text-xs">ANALYTICS_ENABLED</code>
            nincs-e <code className="rounded bg-cream px-1 py-0.5 text-xs">0</code>-ra állítva, és
            hogy éles környezetben be van-e állítva az
            <code className="mx-1 rounded bg-cream px-1 py-0.5 text-xs">ANALYTICS_SALT</code>.
            A saját böngésződ nyomkövetés-tiltása (GPC / Do Not Track) is elnyeli a saját
            látogatásaidat — ez szándékos.
          </p>
        </div>
      )}

      {/* ── Forgalom ───────────────────────────────────────────────── */}
      <AdminMetricsGrid>
        <AdminStatCard
          title="Napi egyedi látogató (össz.)"
          value={traffic.totalVisitors}
          subtitle="A látogató-azonosító naponta rotál — ez a napi értékek összege, nem havi egyedi ember."
        />
        <AdminStatCard
          title="Oldalletöltés"
          value={traffic.totalPageViews}
          subtitle={`${RANGE_DAYS[range]} napos ablak`}
        />
      </AdminMetricsGrid>

      <Panel
        title="Forgalom időben"
        description="Eseményből számolt érték — ad-blocker és nyomkövetés-tiltás miatt alulmér."
      >
        {traffic.hasData ? (
          <AdminTrendChart
            labels={window.labels}
            series={[
              {
                name: "Egyedi látogató",
                color: "var(--color-sage)",
                values: traffic.dailyVisitors,
              },
              {
                name: "Oldalletöltés",
                color: "var(--color-bronze)",
                values: traffic.pageViews,
              },
            ]}
          />
        ) : (
          <EmptyHint>Nincs adat ebben az időszakban.</EmptyHint>
        )}
      </Panel>

      {/* ── Akvizíciós tölcsér ─────────────────────────────────────── */}
      <Panel
        title="Akvizíciós tölcsér"
        description="Bal oldalon az eseményből számolt (lossy), jobb oldalon a DB-ből számolt (pontos) érték. Ahol mindkettő van, az eltérés a mérési veszteség."
      >
        <div className="space-y-3">
          {funnel.map((step) => {
            const share =
              firstFunnelValue && firstFunnelValue > 0 && step.eventValue !== null
                ? Math.round((step.eventValue / firstFunnelValue) * 100)
                : null;
            return (
              <div key={step.label} className="rounded-lg border border-sand p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{step.label}</span>
                  <span className="text-xs text-muted">{step.note}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <span className="text-2xl font-bold tabular-nums text-ink">
                    {step.eventValue ?? "—"}
                    <span className="ml-1.5 text-xs font-normal text-muted">esemény</span>
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-ink">
                    {step.dbValue ?? "—"}
                    <span className="ml-1.5 text-xs font-normal text-muted">DB</span>
                  </span>
                  {share !== null && (
                    <span className="text-xs font-semibold text-bronze">{share}% a belépéstől</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ── Lemorzsolódás a kitöltésben ────────────────────────────── */}
      <Panel
        title="Kitöltési lemorzsolódás"
        description="Hány különböző látogató látta az adott sorszámú kérdést. A meredek esés mutatja, hol veszítjük el őket."
      >
        {dropOff.length > 0 ? (
          <AdminTrendChart
            labels={dropOff.map((point) => String(point.index + 1))}
            series={[
              {
                name: "Kérdést látta",
                color: "var(--color-sage)",
                values: dropOff.map((point) => point.viewers),
              },
            ]}
          />
        ) : (
          <EmptyHint>Még nincs kérdés-szintű adat.</EmptyHint>
        )}
      </Panel>

      {/* ── Forrás és tartalom ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminTableSection
          title="Legnézettebb útvonalak"
          description="Normalizált útvonal — token és azonosító sosem kerül tárolásra."
          rows={topPaths.map((row) => ({ label: row.label, value: row.value }))}
        />
        <AdminTableSection
          title="Hivatkozó források"
          description="Csak a hivatkozó host; teljes URL soha."
          rows={referrers.map((row) => ({ label: row.label, value: row.value }))}
        />
      </div>

      {campaigns.length > 0 && (
        <AdminTableSection
          title="Kampányok (UTM)"
          description="Csak arra az oldalletöltésre kerül rá, ahol az URL-ben még ott volt az UTM — eszközön semmit nem tárolunk."
          rows={campaigns.map((row) => ({ label: row.label, value: row.value }))}
        />
      )}

      <AdminTableSection
        title="Esemény-volumen"
        description="Melyik esemény hányszor keletkezett az időszakban."
        rows={volume.map((row) => ({ label: row.label, value: row.value }))}
      />

      {/* ── Nyers események (hibakeresés) ──────────────────────────── */}
      <Panel
        title="Legutóbbi események"
        description="Hibakereséshez: megérkezik-e egyáltalán, amit vársz."
      >
        {recent.length === 0 ? (
          <EmptyHint>Nincs rögzített esemény.</EmptyHint>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-sand">
                  {["Mikor", "Esemény", "Útvonal", "Forrás", "Eszköz", "Tulajdonságok"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="pb-2 pr-4 font-mono text-[11px] uppercase tracking-widest text-muted last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id} className="border-b border-sand/60 last:border-0">
                    <td className="py-2 pr-4 align-top text-xs tabular-nums text-ink-body">
                      {formatTime(row.occurredAt)}
                    </td>
                    <td className="py-2 pr-4 align-top text-xs font-semibold text-ink">{row.name}</td>
                    <td className="py-2 pr-4 align-top text-xs text-ink-body">{row.path ?? "—"}</td>
                    <td className="py-2 pr-4 align-top text-xs text-ink-body">
                      {row.origin}
                      {row.isAuthed ? " · belépve" : ""}
                    </td>
                    <td className="py-2 pr-4 align-top text-xs text-ink-body">
                      {row.deviceClass ?? "—"}
                    </td>
                    <td className="py-2 align-top font-mono text-[11px] text-ink-body">
                      {row.props ? JSON.stringify(row.props) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ── Adatkezelési lábjegyzet ────────────────────────────────── */}
      <div className="rounded-xl border border-sand bg-cream p-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          Mit mérünk — és mit nem
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink-body">
          <li>
            · Nincs süti és nincs semmilyen eszköz-oldali tárolás. A látogató-azonosító napi
            rotáló pszeudonim (IP + böngésző hash), az IP-t nem tároljuk.
          </li>
          <li>
            · A GPC / Do Not Track jelzést tiszteletben tartjuk — az így jelző látogatóktól
            semmit nem mérünk.
          </li>
          <li>
            · Esemény-tulajdonságban nincs e-mail, név, szabad szöveg, kérdőív-válasz, pontszám
            vagy meghívó-token; a katalógus zárt sémákkal dolgozik.
          </li>
          <li>
            · Megőrzés: {ANALYTICS_RETENTION_MONTHS} hónap, utána automatikus törlés. Jelenleg{" "}
            <strong className="tabular-nums">{storage.total}</strong> esemény van tárolva
            {storage.oldest ? `, a legrégebbi ${formatDate(storage.oldest)}` : ""}.
          </li>
          <li>· Profil törlésekor az események elveszítik a kapcsolatot a személlyel.</li>
        </ul>
      </div>
    </div>
  );
}
