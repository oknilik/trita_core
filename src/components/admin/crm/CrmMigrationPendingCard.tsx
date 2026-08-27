import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import type { SchemaOutOfSyncDetail } from "@/lib/crm/errors";

// ─────────────────────────────────────────────────────────────────────
// Migráció-lemaradás állapotkártya (szerver-renderelhető, admin-only HU).
// Akkor jelenik meg, ha a futó környezet DB-jéből hiányzik a CRM-séma
// (P2021/P2022) — általános hibaoldal helyett kimondja a pontos teendőt.
// ─────────────────────────────────────────────────────────────────────

export function CrmMigrationPendingCard({ detail }: { detail: SchemaOutOfSyncDetail }) {
  return (
    <section className="rounded-2xl border border-state-warning-border bg-state-warning-bg p-5 md:p-6">
      <SectionEyebrow tone="bronze">crm · környezet</SectionEyebrow>
      <h2 className="mt-2 font-fraunces text-title text-ink">
        A CRM-adatbázis-migrációk még nem futottak le ezen a környezeten
      </h2>
      <p className="mt-2 max-w-[640px] text-body text-ink-body/80">
        A CRM-kód friss, de a környezet adatbázisából hiányzik a CRM-séma
        (hibakód: <span className="font-semibold">{detail.code}</span>
        {detail.target ? (
          <>
            {" "}
            – hiányzó elem: <span className="font-semibold">{detail.target}</span>
          </>
        ) : null}
        ). Ez deploy és migráció-futtatás közti eltérés – nem felhasználói hiba.
      </p>
      <p className="mt-3 text-body text-ink-body/80">
        Teendő: futtasd a migrációkat ennek a környezetnek az adatbázisán
        (Vercelnél ellenőrizd, hogy a build command tartalmazza-e):
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/[0.06] px-4 py-3 font-mono text-caption text-ink">
        pnpm exec prisma migrate deploy
      </pre>
      <p className="mt-3 text-caption text-ink-body/60">
        A migrációk lefutása után ez a felület magától helyreáll – nincs
        további teendő. Amíg a séma hiányzik, a Kérdések fül és a /contact
        űrlap mentése is hibázhat (az Inquiry.dealId oszlop ugyanebben a
        migráció-csomagban érkezik).
      </p>
    </section>
  );
}
