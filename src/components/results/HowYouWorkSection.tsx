"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { HowYouWorkParts } from "@/lib/workstyle-content";

interface HowYouWorkSectionProps {
  /**
   * Nevesített slotok a producer-től (workstyle-content, FIX 3): a korábbi
   * pozicionális tömbnél a [1]-es bekezdés vakon „Figyelendő" címkét kapott,
   * pedig csak valódi risk-párnál kockázat — pozitív narratíva is odakerült,
   * a tényleges kockázat meg a kontextusba csúszott.
   */
  parts: HowYouWorkParts;
  isUnlocked: boolean;
  /**
   * Ha a befoglaló felület MÁR kiírja a szekció címét (megosztott profil
   * fejezet-akkordeonjai), a saját eyebrow+cím duplikálna — ilyenkor csak a
   * tartalom megy ki, a szekció-keret a befoglalóé.
   */
  hideHeading?: boolean;
}

export function HowYouWorkSection({ parts, isUnlocked, hideHeading = false }: HowYouWorkSectionProps) {
  const { locale } = useLocale();

  if (!isUnlocked || !parts.main) return null;

  const mainPattern = parts.main;
  const watchArea = parts.watch ?? "";
  // „Jellemző mintázat" (tone: "note") — semleges kártya: valódi, cselekvésre
  // váltható megfigyelés a fordított skálájú (Emocionalitás) párokból. NEM a
  // borostyán „Figyelendő" (deficit-keretes) és NEM a szürke „Kontextus"
  // maradék-slot: saját, szándékos helye van a rácsban.
  const notes = parts.notes.join(" ");
  const context = parts.context.join(" ");

  return (
    <div className={hideHeading ? undefined : "py-8"}>
      {!hideHeading && (
        <>
          <div className="mb-1.5 flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
            <p className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
              {t("results.howYouWorkEyebrow", locale)}
            </p>
          </div>
          <h3 className="mb-5 font-fraunces text-lg text-[var(--color-text-primary)]">
            {t("content.howYouWorkSub", locale)}
          </h3>
        </>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border-[1.5px] border-[var(--color-action-primary-bg)]/20 bg-[var(--color-surface-self-accent-soft)] p-[18px]">
          <p className="mb-1.5 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-self-deep)]">
            {t("results.howYouWorkMain", locale)}
          </p>
          <p className="max-w-prose text-body text-[var(--color-accent-self-deep)]">
            {mainPattern}
          </p>
        </div>

        {watchArea && (
          <div className="rounded-xl border-[1.5px] border-[var(--color-accent-primary)]/20 bg-[var(--color-surface-highlight-warm)] p-[18px]">
            <p className="mb-1.5 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-primary-strong)]">
              {t("results.howYouWorkWatch", locale)}
            </p>
            <p className="max-w-prose text-body text-[var(--color-text-secondary)]">
              {watchArea}
            </p>
          </div>
        )}

        {notes && (
          <div className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-[18px]">
            <p className="mb-1.5 text-micro font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {t("results.howYouWorkNote", locale)}
            </p>
            <p className="max-w-prose text-body text-[var(--color-text-secondary)]">
              {notes}
            </p>
          </div>
        )}

        {context && (
          <div className="col-span-1 rounded-xl md:col-span-2 border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-[18px]">
            <p className="mb-1.5 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              {t("results.howYouWorkContext", locale)}
            </p>
            <p className="max-w-prose text-body text-[var(--color-text-secondary)]">
              {context}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
