"use client";

import { useMemo, useState } from "react";
import {
  calculateQuote,
  emptyQuoteInput,
  type QuoteInput,
  type QuoteWarning,
} from "@/lib/quote/calculate";
import {
  DISCOUNT_KINDS,
  DISCOUNT_LABELS,
  QUOTE_STEPS,
  QUOTE_STEP_LABELS,
  type DiscountKind,
  type QuoteStep,
  type RateCard,
} from "@/lib/quote/rate-card";

// Belső ajánlat-kalkulátor.
//
// Nem árlista: azt mutatja meg, mennyi marad a munkán. A legfontosabb szám
// az EFFEKTÍV ÓRADÍJ — ezen dől el az alku, ezért az van kiemelve, nem a
// végösszeg.

const huf = (value: number) =>
  new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(value);

const WARNING_TEXT: Record<QuoteWarning, string> = {
  BELOW_TARGET_HOURLY:
    "Az effektív óradíj a cél alatt van. Ez az ajánlat a saját idődből fizet.",
  DISCOUNT_OVER_CAP: "A kedvezmény meghaladja a keretet — ez külön döntés.",
  DISCOUNT_WITHOUT_REASON: "Indoklás nélküli kedvezmény: később nem lesz mire hivatkozni.",
  NO_FOLLOW_UP:
    "Nincs utánkövetés. Egyszeri mérésből nem lesz üzlet — legalább egy hullámot érdemes betenni.",
};

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-widest text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 text-sm tabular-nums text-ink outline-none focus:border-bronze"
        />
        {suffix && <span className="shrink-0 text-xs text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

export function QuoteCalculator({
  initialRate,
  storedRate,
}: {
  initialRate: RateCard;
  /** Hamis, ha még az alapértelmezett (placeholder) díjtételek vannak érvényben. */
  storedRate: boolean;
}) {
  const [input, setInput] = useState<QuoteInput>(emptyQuoteInput());
  const [rate, setRate] = useState<RateCard>(initialRate);
  const [saved, setSaved] = useState(storedRate);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showRates, setShowRates] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => calculateQuote(input, rate), [input, rate]);

  const patch = (changes: Partial<QuoteInput>) =>
    setInput((current) => ({ ...current, ...changes }));

  const toggleStep = (step: QuoteStep) =>
    patch({
      steps: input.steps.includes(step)
        ? input.steps.filter((item) => item !== step)
        : [...input.steps, step],
    });

  async function saveRates() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/quote/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rate),
      });
      const body = (await res.json()) as { issues?: string[] };
      if (!res.ok) throw new Error(body.issues?.join(", ") || "Sikertelen mentés");
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Sikertelen mentés");
    } finally {
      setSaving(false);
    }
  }

  // Ajánlat-szöveg: a vevőnek szánt összefoglaló. SZÁNDÉKOSAN nincs benne
  // óradíj, fedezet és kedvezmény-százalék — azok belső számok.
  const quoteText = useMemo(() => {
    const rows = result.lines
      .filter((line) => line.key !== "travel")
      .map((line) => `· ${line.label}: ${huf(line.amount)}`);
    const parts = [
      `Ajánlat — ${input.headcount} fő, ${input.teams} csapat`,
      "",
      ...rows,
      result.passThroughSubtotal > 0
        ? `· Kiszállás (továbbhárított): ${huf(result.passThroughSubtotal)}`
        : null,
      "",
      result.discountAmount > 0
        ? `Kedvezmény${input.discountKind ? ` (${DISCOUNT_LABELS[input.discountKind]})` : ""}: −${huf(result.discountAmount)}`
        : null,
      `Egyszeri díj: ${huf(result.oneOffTotal)}`,
      result.retainerTotal > 0
        ? `Havi kísérés: ${huf(rate.retainerMonthlyFee)} / hó, ${input.retainerMonths} hónap`
        : null,
      "",
      "A díjak nettó összegek. A számlázás átutalással történik.",
    ].filter((row): row is string => row !== null);
    return parts.join("\n");
  }, [input, rate.retainerMonthlyFee, result]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ── Bemenetek ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-fraunces text-lg text-ink">Terjedelem</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <NumberField
              label="Létszám"
              value={input.headcount}
              onChange={(headcount) => patch({ headcount })}
              suffix="fő"
            />
            <NumberField
              label="Csapatok"
              value={input.teams}
              min={1}
              onChange={(teams) => patch({ teams })}
              suffix="db"
            />
            <NumberField
              label="Workshop"
              value={input.workshopDays}
              step={0.5}
              onChange={(workshopDays) => patch({ workshopDays })}
              suffix="nap"
            />
            <NumberField
              label="Kiszállás"
              value={input.travelDays}
              onChange={(travelDays) => patch({ travelDays })}
              suffix="nap"
            />
          </div>

          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">
            Mérés-lépések
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUOTE_STEPS.map((step) => {
              const active = input.steps.includes(step);
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => toggleStep(step)}
                  className={`min-h-[40px] rounded-full border px-3.5 text-sm transition ${
                    active
                      ? "border-sage bg-sage-soft text-ink"
                      : "border-sand bg-white text-muted hover:border-bronze-edge"
                  }`}
                >
                  {QUOTE_STEP_LABELS[step]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-fraunces text-lg text-ink">Utánkövetés</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
            Az ismételt hullám a mérési díj {rate.waveRatePct}%-áért megy: a setup és a
            csapat megismerése egyszeri munka. A havi kísérés ettől független tétel.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <NumberField
              label="Hullámok"
              value={input.waves}
              onChange={(waves) => patch({ waves })}
              suffix="db"
            />
            <NumberField
              label="Havi kísérés"
              value={input.retainerMonths}
              onChange={(retainerMonths) => patch({ retainerMonths })}
              suffix="hó"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-fraunces text-lg text-ink">Kedvezmény</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
            Nevesített, lejáró kedvezmény — ad-hoc alku helyett. Keret:{" "}
            {rate.maxDiscountPct}%.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {DISCOUNT_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() =>
                  patch({ discountKind: input.discountKind === kind ? null : (kind as DiscountKind) })
                }
                className={`min-h-[40px] rounded-full border px-3.5 text-sm transition ${
                  input.discountKind === kind
                    ? "border-sage bg-sage-soft text-ink"
                    : "border-sand bg-white text-muted hover:border-bronze-edge"
                }`}
              >
                {DISCOUNT_LABELS[kind]}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
            <NumberField
              label="Mérték"
              value={input.discountPct}
              onChange={(discountPct) => patch({ discountPct })}
              suffix="%"
            />
            <label className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Indoklás
              </span>
              <input
                type="text"
                value={input.discountReason}
                onChange={(event) => patch({ discountReason: event.target.value })}
                placeholder="Miért adjuk? (belső feljegyzés)"
                className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 text-sm text-ink outline-none focus:border-bronze"
              />
            </label>
          </div>
        </section>

        {/* ── Díjtételek ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-fraunces text-lg text-ink">Díjtételek</h2>
            <button
              type="button"
              onClick={() => setShowRates((open) => !open)}
              className="min-h-[40px] text-sm text-bronze underline underline-offset-2"
            >
              {showRates ? "Elrejtem" : "Szerkesztem"}
            </button>
          </div>
          {!saved && (
            <p className="mt-2 rounded-lg border border-bronze-edge bg-bronze-soft/40 p-3 text-xs leading-relaxed text-ink-body">
              Ezek még a beépített PLACEHOLDER értékek — nincs mögöttük valós költségadat.
              Állítsd át és mentsd el, mielőtt ajánlatot adsz belőle.
            </p>
          )}

          {showRates && (
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Programdíj"
                  value={rate.baseFee}
                  step={10_000}
                  onChange={(baseFee) => setRate({ ...rate, baseFee })}
                  suffix="Ft"
                />
                <NumberField
                  label="Cél-óradíj"
                  value={rate.targetHourlyRate}
                  step={1_000}
                  onChange={(targetHourlyRate) => setRate({ ...rate, targetHourlyRate })}
                  suffix="Ft/h"
                />
                <NumberField
                  label="Workshop-nap"
                  value={rate.workshopDayFee}
                  step={10_000}
                  onChange={(workshopDayFee) => setRate({ ...rate, workshopDayFee })}
                  suffix="Ft"
                />
                <NumberField
                  label="Kiszállás-nap"
                  value={rate.travelDayFee}
                  step={5_000}
                  onChange={(travelDayFee) => setRate({ ...rate, travelDayFee })}
                  suffix="Ft"
                />
                <NumberField
                  label="Hullám-arány"
                  value={rate.waveRatePct}
                  onChange={(waveRatePct) => setRate({ ...rate, waveRatePct })}
                  suffix="%"
                />
                <NumberField
                  label="Hullám fix díj"
                  value={rate.waveFixedFee}
                  step={10_000}
                  onChange={(waveFixedFee) => setRate({ ...rate, waveFixedFee })}
                  suffix="Ft"
                />
                <NumberField
                  label="Havi kísérés"
                  value={rate.retainerMonthlyFee}
                  step={10_000}
                  onChange={(retainerMonthlyFee) => setRate({ ...rate, retainerMonthlyFee })}
                  suffix="Ft/hó"
                />
                <NumberField
                  label="Kedvezmény-keret"
                  value={rate.maxDiscountPct}
                  onChange={(maxDiscountPct) => setRate({ ...rate, maxDiscountPct })}
                  suffix="%"
                />
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Létszám-sávok (marginális, fő/Ft)
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {rate.headBands.map((band, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 text-xs text-muted">
                        {band.upTo == null ? "afölött" : `${band.upTo} főig`}
                      </span>
                      <input
                        type="number"
                        value={band.perHead}
                        step={500}
                        onChange={(event) => {
                          const headBands = [...rate.headBands];
                          headBands[index] = {
                            ...band,
                            perHead: Number(event.target.value),
                          };
                          setRate({ ...rate, headBands });
                        }}
                        className="min-h-[40px] w-32 rounded-lg border border-sand bg-white px-3 text-sm tabular-nums text-ink outline-none focus:border-bronze"
                      />
                      <span className="text-xs text-muted">Ft / fő</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Mérés-lépések felára (fő / fix)
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {QUOTE_STEPS.map((step) => {
                    const stepRate = rate.stepRates[step];
                    if (!stepRate) return null;
                    return (
                      <div key={step} className="flex items-center gap-2">
                        <span className="w-44 shrink-0 text-xs text-muted">
                          {QUOTE_STEP_LABELS[step]}
                        </span>
                        {(["perHead", "fixed"] as const).map((field) => (
                          <input
                            key={field}
                            type="number"
                            value={stepRate[field]}
                            step={500}
                            onChange={(event) =>
                              setRate({
                                ...rate,
                                stepRates: {
                                  ...rate.stepRates,
                                  [step]: { ...stepRate, [field]: Number(event.target.value) },
                                },
                              })
                            }
                            className="min-h-[40px] w-28 rounded-lg border border-sand bg-white px-3 text-sm tabular-nums text-ink outline-none focus:border-bronze"
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Óra-becslés (a fedezet-számításhoz)
                </p>
                <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-3">
                  {(
                    [
                      ["setup", "Setup"],
                      ["perTeam", "Csapatonként"],
                      ["perTenHeads", "10 főnként"],
                      ["perWorkshopDay", "Workshop-nap"],
                      ["perWave", "Hullámonként"],
                      ["perRetainerMonth", "Kísérés-hó"],
                      ["perTravelDay", "Kiszállás-nap"],
                    ] as const
                  ).map(([field, label]) => (
                    <NumberField
                      key={field}
                      label={label}
                      value={rate.hours[field]}
                      step={0.5}
                      onChange={(value) =>
                        setRate({ ...rate, hours: { ...rate.hours, [field]: value } })
                      }
                      suffix="ó"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void saveRates()}
                  disabled={saving}
                  className="min-h-[44px] rounded-lg bg-action-primary-bg px-5 text-sm font-semibold text-action-primary-fg transition hover:bg-action-primary-bg-hover disabled:opacity-60"
                >
                  Díjtételek mentése
                </button>
                {saveError && <span className="text-xs text-bronze-dark">{saveError}</span>}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Összegzés ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">
            {"// ajánlat"}
          </p>

          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {result.lines.map((line) => (
              <li key={line.key} className="flex items-baseline justify-between gap-3">
                <span className="text-ink-body">
                  {line.label}
                  {line.passThrough && <span className="text-muted"> · továbbhárított</span>}
                </span>
                <span className="tabular-nums text-ink">{huf(line.amount)}</span>
              </li>
            ))}
          </ul>

          {result.discountAmount > 0 && (
            <p className="mt-2 flex items-baseline justify-between gap-3 border-t border-sand pt-2 text-sm">
              <span className="text-ink-body">Kedvezmény ({input.discountPct}%)</span>
              <span className="tabular-nums text-bronze-dark">
                −{huf(result.discountAmount)}
              </span>
            </p>
          )}

          <p className="mt-3 border-t border-sand pt-3 text-sm text-ink-body">Egyszeri díj</p>
          <p className="font-fraunces text-3xl tabular-nums text-ink">
            {huf(result.oneOffTotal)}
          </p>
          {result.retainerTotal > 0 && (
            <p className="mt-1 text-sm text-ink-body">
              + havi kísérés: {huf(result.retainerTotal)} ({input.retainerMonths} hó)
            </p>
          )}
          {result.perHeadEffective != null && (
            <p className="mt-1 text-xs text-muted">
              Effektív fejenként: {huf(result.perHeadEffective)}
            </p>
          )}
        </section>

        {/* A DÖNTŐ szám: nem a végösszeg, hanem ami a munkán marad. */}
        <section className="rounded-2xl border border-sand bg-cream p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Effektív óradíj
          </p>
          <p
            className={`font-fraunces text-3xl tabular-nums ${
              result.warnings.includes("BELOW_TARGET_HOURLY") ? "text-bronze-dark" : "text-ink"
            }`}
          >
            {result.effectiveHourlyRate == null ? "—" : huf(result.effectiveHourlyRate)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {result.estimatedHours} becsült óra · cél {huf(rate.targetHourlyRate)} · padló{" "}
            {huf(result.floorPrice)}
          </p>
        </section>

        {result.warnings.length > 0 && (
          <section className="rounded-2xl border border-bronze-edge bg-bronze-soft/40 p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-bronze-dark">
              Figyelmeztetés
            </p>
            <ul className="mt-2 flex flex-col gap-2 text-xs leading-relaxed text-ink-body">
              {result.warnings.map((warning) => (
                <li key={warning}>{WARNING_TEXT[warning]}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Ajánlat-szöveg
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(quoteText);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }}
              className="min-h-[36px] text-xs text-bronze underline underline-offset-2"
            >
              {copied ? "Másolva" : "Másolás"}
            </button>
          </div>
          {/* Belső számok (óradíj, fedezet, kedvezmény-keret) SZÁNDÉKOSAN
              nincsenek benne — ez a szöveg a vevőnek megy. */}
          <textarea
            readOnly
            value={quoteText}
            rows={12}
            className="mt-2 w-full rounded-lg border border-sand bg-cream p-3 font-mono text-xs leading-relaxed text-ink-body"
          />
        </section>
      </div>
    </div>
  );
}
