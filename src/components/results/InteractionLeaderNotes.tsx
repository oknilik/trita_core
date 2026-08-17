"use client";

import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { InteractionLeaderNote } from "@/lib/interaction-view";

interface InteractionLeaderNotesProps {
  notes: InteractionLeaderNote[];
}

/**
 * A vezetői kiegészítők — az EGYETLEN tartalom, ami a kapcsolat-választótól
 * függ, ezért mindkét felületen közvetlenül a választó alatt áll. Korábban a
 * lap alján volt: a user átállította a kapcsolatot, és a képernyőn semmi nem
 * változott.
 *
 * A wrapper üresen is a fában marad (`sr-only`: nincs layout-hatása), hogy a
 * live-region be tudja mondani a megjelenést.
 */
export function InteractionLeaderNotes({ notes }: InteractionLeaderNotesProps) {
  const { locale } = useLocale();

  return (
    <div aria-live="polite" className={notes.length > 0 ? undefined : "sr-only"}>
      {notes.length > 0 ? (
        <section className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-highlight-warm)] p-5">
          <p className="mb-3 text-label uppercase text-[var(--color-accent-primary-strong)]">
            {t("results.interactionLeaderTitle", locale)}
          </p>
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.dim}>
                <p className="text-body leading-relaxed text-[var(--color-text-secondary)]">
                  {note.text}
                </p>
                <p className="mt-1 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
                  {note.dimLabel}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
