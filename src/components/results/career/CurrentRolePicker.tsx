"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

// „Mi a mostani munkád?" — opcionális, de ez a validáció (known-groups) egyetlen
// valódi adatforrása: ha a motor mér valamit, a betöltött saját foglalkozásnak
// szisztematikusan feljebb kell kerülnie a saját rangsorban.

interface Suggestion {
  id: string;
  hu: string;
  feor: string | null;
}

export function CurrentRolePicker({
  value,
  valueLabel,
  onSelect,
  onClear,
}: {
  value: string | null;
  valueLabel: string | null;
  onSelect: (occupation: Suggestion) => void | Promise<void>;
  onClear: () => void | Promise<void>;
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setItems([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/career/occupations?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { items?: Suggestion[] };
        setItems(data.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <div className="mt-4 rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4">
      <p className="text-caption font-semibold text-[var(--color-text-primary)]">
        {t("results.cfCurrentRoleTitle", locale)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        {t("results.cfCurrentRoleBody", locale)}
      </p>

      {value && valueLabel ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-card px-3 py-1 text-xs font-medium text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-soft)]">
            {valueLabel}
          </span>
          <button
            type="button"
            onClick={() => void onClear()}
            className="inline-flex min-h-[44px] items-center text-xs font-semibold text-[var(--color-text-muted)] transition hover:text-ink"
          >
            {t("results.cfCurrentRoleClear", locale)}
          </button>
        </div>
      ) : (
        <div className="mt-2.5">
          {/* iOS Safari 16px alatti betűméretnél fókuszkor rázoomol az inputra –
              mobilon text-base, md:-től az eredeti 12px. */}
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={60}
            placeholder={t("results.cfCurrentRolePlaceholder", locale)}
            className="min-h-[44px] w-full max-w-md rounded-lg border border-[var(--color-border-default)] bg-surface-card px-3 text-base text-[var(--color-text-primary)] md:min-h-[38px] md:text-xs"
          />
          {busy && (
            <p className="mt-1.5 text-micro text-[var(--color-text-muted)]">
              {t("results.cfCurrentRoleSearching", locale)}
            </p>
          )}
          {items.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setItems([]);
                      void onSelect(item);
                    }}
                    className="flex min-h-[44px] w-full items-center rounded-lg border border-[var(--color-border-soft)] bg-surface-card px-3 py-2 text-left text-xs text-[var(--color-text-primary)] transition hover:border-sage/50 hover:bg-sage/5 md:min-h-0"
                  >
                    {item.hu}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
