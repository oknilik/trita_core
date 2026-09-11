"use client";

import { useState } from "react";
import { t, tf, type Locale } from "@/lib/i18n";
import type { CommitmentSuggestion } from "@/lib/team-commitments";
import { Button } from "@/components/ui/primitives/Button";
import { CommitmentFormFeedback, useCommitmentForm, type ReloadCommitments, type SaveCommitment } from "./CommitmentFormFeedback";

function suggestionKey(item: CommitmentSuggestion) { return `${item.reportId}:${item.sourceActionKey}`; }

export function CommitmentSuggestions({ suggestions, locale, onSave, onReload }: {
  suggestions: CommitmentSuggestion[]; locale: Locale; onSave: SaveCommitment; onReload: ReloadCommitments;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const form = useCommitmentForm({ onSave, onReload });
  const chosen = suggestions.filter((item) => selected.includes(suggestionKey(item)));
  return (
    <details className="min-w-0 border-t border-border-default pt-3">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring">{t("commitments.suggestions", locale)} · {suggestions.length}</summary>
      <form className="space-y-4 py-3" aria-label={t("commitments.suggestions", locale)} onSubmit={async (event) => {
        event.preventDefault();
        if (!chosen.length) return;
        if (await form.save({ action: "import", items: chosen.map(({ reportId, sourceActionKey }) => ({ reportId, sourceActionKey })) })) setSelected([]);
      }}>
        <p className="text-sm leading-relaxed text-ink-body">{t("commitments.suggestionsHelp", locale)}</p>
        <div className="divide-y divide-border-default">
          {suggestions.map((item) => {
            const key = suggestionKey(item);
            const checked = selected.includes(key);
            return <label key={key} className="flex min-h-11 cursor-pointer items-start gap-3 py-4">
              <input type="checkbox" checked={checked} disabled={form.busy || (!checked && chosen.length >= 20)} onChange={() => setSelected((current) => checked ? current.filter((entry) => entry !== key) : [...current, key])} className="mt-1 size-4 shrink-0 accent-[var(--color-action-primary-bg)]" />
              <span className="min-w-0 text-sm"><span className="block font-semibold text-ink">{item.title}</span><span className="mt-1 block whitespace-pre-wrap text-ink-body">{item.description}</span><span className="mt-1 block text-xs text-ink-body">{item.reportTitle}</span></span>
            </label>;
          })}
        </div>
        {chosen.length >= 20 ? <p className="text-xs text-ink-body">{t("commitments.importBatchLimit", locale)}</p> : null}
        <CommitmentFormFeedback form={form} locale={locale} />
        <Button type="submit" loading={form.busy} disabled={!chosen.length || form.saveDisabled} className="max-w-full whitespace-normal py-2">{tf("commitments.importSelected", locale, { count: chosen.length })}</Button>
      </form>
    </details>
  );
}
