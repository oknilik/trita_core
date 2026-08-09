import { dimColors } from "@/lib/color-system";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SimpleStatement, SimpleStatementKind } from "@/lib/results/simple-summary";

// ─────────────────────────────────────────────────────────────────────
// A három állítás: erősség → működésmód → figyelendő.
//
// Ez a tanácsadói visszajelzés természetes íve, és önmagában is teljes:
// aki csak ennyit olvas el, az is választ kap arra, amiért megnyitotta
// az oldalt.
//
// Minden állítás alatt ott a forrás-dimenzió (becsült vs mért alapelv).
// Kiegyensúlyozott profilnál a „figyelendő" nem egy dimenzióról szól,
// ilyenkor nincs chip — nem gyártunk hamis forrást.
// ─────────────────────────────────────────────────────────────────────

const KIND_LABEL_KEY: Record<SimpleStatementKind, string> = {
  strength: "results.simpleStatementStrength",
  pattern: "results.simpleStatementPattern",
  watch: "results.simpleStatementWatch",
};

/**
 * A címke pöttye a forrás-dimenzió színét viseli (identitás), a
 * forrás nélküli „figyelendő" a bronz akcentust — az értékelő rampa
 * (zsálya→bronz) marad a részletes nézeté.
 */
function accentColor(statement: SimpleStatement): string {
  if (!statement.source) return "var(--color-accent-primary)";
  return dimColors(statement.source.code).base;
}

export function StatementBlock({
  statements,
  locale,
}: {
  statements: SimpleStatement[];
  locale: Locale;
}) {
  if (statements.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {statements.map((statement) => {
        const source = statement.source ? dimColors(statement.source.code) : null;
        return (
          <article
            key={statement.kind}
            className="border border-[var(--color-border-default)] bg-surface-card px-5 py-5 shadow-[var(--ui-shadow-sm)] first:rounded-t-[18px] last:rounded-b-[18px] md:px-6"
          >
            <p className="flex items-center gap-2 text-micro font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              <span
                aria-hidden
                className="h-[7px] w-[7px] rounded-full"
                style={{ backgroundColor: accentColor(statement) }}
              />
              {t(KIND_LABEL_KEY[statement.kind], locale)}
            </p>
            <h3 className="mt-2 font-fraunces text-heading font-medium leading-snug tracking-tight text-[var(--color-text-primary)]">
              {statement.headline}
            </h3>
            <p className="mt-2 max-w-[60ch] text-body leading-relaxed text-[var(--color-text-secondary)]">
              {statement.body}
            </p>
            {statement.source && source && (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-micro text-[var(--color-text-muted)]">
                {t("results.simpleStatementSource", locale)}
                <span
                  className="rounded-md px-2 py-0.5 text-micro font-medium"
                  style={{ backgroundColor: source.soft, color: source.strong }}
                >
                  {statement.source.label}
                </span>
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
