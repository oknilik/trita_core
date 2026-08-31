"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import {
  ACTIVITY_KIND_LABELS,
  MANUAL_ACTIVITY_KINDS,
  type ManualActivityKind,
} from "@/lib/crm/constants";
import {
  CRM_FIELD_LABEL_CLASS,
  CRM_INPUT_CLASS,
  crmRequest,
  dayInputToIso,
} from "@/components/admin/crm/crm-ui";

// ─────────────────────────────────────────────────────────────────────
// Gyors-naplózó — a napi 10 másodperces flow magja: kind-pill + egysoros
// összefoglaló + (kibontva) törzs, visszadátum és „következő lépés ezután”
// EGY űrlapban, EGY POST-tal (a backend logActivity tranzakciója viszi).
// Enter a summary-mezőben és Cmd/Ctrl+Enter bárhol az űrlapon = mentés.
// ─────────────────────────────────────────────────────────────────────

interface QuickLogFormProps {
  dealId: string;
  /** A „következő lépés” mezők nyitva induljanak (a Ma-panel „Kész” modalja). */
  nextActionOpenByDefault?: boolean;
  /**
   * „Kész”-mód: ha nincs új dátum, a mentés TÖRLI az elintézett next actiont
   * (nextActionAt: null) — különben a deal a Ma-panelen ragadna. A deal-nézet
   * sima naplózója ezt nem kapcsolja be: ott dátum nélkül nem nyúlunk hozzá.
   */
  clearNextActionWhenEmpty?: boolean;
  onSaved?: () => void;
}

export function QuickLogForm({
  dealId,
  nextActionOpenByDefault = false,
  clearNextActionWhenEmpty = false,
  onSaved,
}: QuickLogFormProps) {
  const router = useRouter();
  const [kind, setKind] = useState<ManualActivityKind>("CALL");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [nextNote, setNextNote] = useState("");
  const [expanded, setExpanded] = useState(nextActionOpenByDefault);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = summary.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);

    const result = await crmRequest(`/api/admin/crm/deals/${dealId}/activities`, {
      method: "POST",
      body: {
        kind,
        summary: trimmed,
        ...(body.trim() ? { body: body.trim() } : {}),
        ...(occurredOn ? { occurredAt: dayInputToIso(occurredOn) } : {}),
        // A nextActionAt JELENLÉTE vezérel a szerveren: dátummal kitűz,
        // null-lal töröl („Kész”-mód), hiányában a deal next actionje
        // érintetlen marad.
        ...(nextDate
          ? {
              nextActionAt: dayInputToIso(nextDate),
              ...(nextNote.trim() ? { nextActionNote: nextNote.trim() } : {}),
            }
          : clearNextActionWhenEmpty
            ? { nextActionAt: null }
            : {}),
      },
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSummary("");
    setBody("");
    setOccurredOn("");
    setNextDate("");
    setNextNote("");
    router.refresh();
    onSaved?.();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  function onFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <form
      data-testid="quick-log-form"
      onSubmit={onSubmit}
      onKeyDown={onFormKeyDown}
      className="flex flex-col gap-3"
    >
      {/* Kind-pillek */}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Bejegyzés típusa">
        {MANUAL_ACTIVITY_KINDS.map((item) => {
          const active = kind === item;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={active}
              data-testid={`quick-log-kind-${item}`}
              onClick={() => setKind(item)}
              className={`min-h-[40px] rounded-full border px-3.5 text-sm transition ${
                active
                  ? "border-sage bg-sage-soft font-semibold text-ink"
                  : "border-sand bg-surface-card text-muted hover:border-bronze-edge hover:text-ink-body"
              }`}
            >
              {ACTIVITY_KIND_LABELS[item]}
            </button>
          );
        })}
      </div>

      {/* Egysoros összefoglaló + mentés */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Mi történt? Röviden, egy mondatban"
          aria-label="Összefoglaló"
          maxLength={300}
          data-testid="quick-log-summary"
          className={`${CRM_INPUT_CLASS} flex-1`}
        />
        <Button
          type="submit"
          size="md"
          loading={busy}
          disabled={!summary.trim()}
          className="shrink-0"
        >
          Mentés
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="inline-flex min-h-[44px] items-center self-start text-xs text-[var(--color-accent-primary-strong)] underline underline-offset-2"
      >
        {expanded ? "Kevesebb mező" : "Részletek és következő teendő"}
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 rounded-xl border border-sand bg-cream/60 p-3">
          <label className="flex flex-col gap-1">
            <span className={CRM_FIELD_LABEL_CLASS}>Részletek (opcionális)</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Hosszabb jegyzet, megállapodások, kontextus…"
              data-testid="quick-log-body"
              className="w-full rounded-lg border border-sand bg-surface-card px-3 py-2 text-sm text-ink-body outline-none transition focus:border-bronze"
            />
          </label>

          <label className="flex flex-col gap-1 sm:max-w-[220px]">
            <span className={CRM_FIELD_LABEL_CLASS}>Mikor történt?</span>
            <input
              type="date"
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
              aria-label="Visszadátumozás"
              className={CRM_INPUT_CLASS}
            />
            <span className="text-xs text-muted">Üresen hagyva: most.</span>
          </label>

          <div className="border-t border-sand pt-3">
            <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">Következő teendő</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
              <input
                type="date"
                value={nextDate}
                onChange={(event) => setNextDate(event.target.value)}
                aria-label="Következő teendő dátuma"
                data-testid="quick-log-next-date"
                className={CRM_INPUT_CLASS}
              />
              <input
                type="text"
                value={nextNote}
                onChange={(event) => setNextNote(event.target.value)}
                maxLength={1000}
                placeholder="Mit kell ezután tenni?"
                aria-label="Következő teendő leírása"
                data-testid="quick-log-next-note"
                className={CRM_INPUT_CLASS}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {clearNextActionWhenEmpty
                ? "Dátum nélkül az elintézett lépés törlődik – jobb, ha rögtön kitűzöd a következőt."
                : "Dátum nélkül az ügy következő teendője nem változik."}
            </p>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg"
        >
          {error}
        </p>
      )}
    </form>
  );
}
