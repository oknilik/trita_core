"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { presentUserError } from "@/lib/user-errors";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  calculateQuote,
  emptyQuoteInput,
  type QuoteInput,
  type QuoteWarning,
} from "@/lib/quote/calculate";
import {
  DISCOUNT_KINDS,
  DISCOUNT_LABELS,
  QUOTE_TIERS,
  QUOTE_TIER_INCLUDES,
  QUOTE_TIER_LABELS,
  quoteInputSchema,
  type DiscountKind,
  type QuoteTier,
  type RateCard,
} from "@/lib/quote/rate-card";
import { formatQuoteNo } from "@/lib/crm/guards";
import {
  crmRequest,
  dayInputToIso,
  formatDay,
  isoToDayInput,
} from "@/components/admin/crm/crm-ui";

// Belső ajánlat-kalkulátor.
//
// Az ár a publikus árlétrából jön (minimumdíj + létszám + csapatszám — ugyanaz, amit a vevő a
// /pricing oldalon lát), a szint tartalmán felüli tételekkel. Amit a
// kalkulátor hozzátesz: mennyi marad a munkán. A legfontosabb szám az
// EFFEKTÍV ÓRADÍJ — ezen dől el az alku, ezért az van kiemelve, nem a
// végösszeg. A díjtételek mentése a publikus oldalak árait is frissíti.
//
// CRM-integráció (2026-08): `deal` prop mellett a kalkulátor perzisztálni
// tud — „Mentés ajánlatként" → DRAFT Quote a dealen (a szerver újraszámol,
// a kliens sosem küld összeget). ?from= forrás-quote-tal DRAFT-szerkesztés
// (update_input) vagy másolat-alap. Deal nélkül sandbox marad.

const huf = (value: number) =>
  new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(value);

const WARNING_TEXT: Record<QuoteWarning, string> = {
  BELOW_TARGET_HOURLY:
    "Az effektív óradíj a cél alatt van. Ez az ajánlat a saját idődből fizet.",
  DISCOUNT_OVER_CAP: "A kedvezmény meghaladja a keretet – ez külön döntés.",
  DISCOUNT_WITHOUT_REASON: "Indoklás nélküli kedvezmény: később nem lesz mire hivatkozni.",
  NO_FOLLOW_UP:
    "Nincs visszamérés. Egyszeri mérésből nem lesz üzlet – a Csapatprogram szint vagy legalább egy további mérési kör kell.",
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
          className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm tabular-nums text-ink outline-none focus:border-bronze"
        />
        {suffix && <span className="shrink-0 text-xs text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

interface CalculatorDeal {
  id: string;
  title: string;
  company: string | null;
  contactName: string;
}

interface CalculatorSourceQuote {
  id: string;
  status: string;
  title: string | null;
  /** Formázott sorszám, pl. "TRT-2026-0007". */
  label: string;
  validUntil: string | null;
}

export function QuoteCalculator({
  initialRate,
  storedRate,
  deal,
  initialInput,
  sourceQuote,
}: {
  initialRate: RateCard;
  /** Hamis, ha még az alapértelmezett (placeholder) díjtételek vannak érvényben. */
  storedRate: boolean;
  /** CRM-deal, amihez a kalkulátor menteni tud (nélküle sandbox). */
  deal?: CalculatorDeal;
  /** Betöltött bemenet (?from= forrás-quote-ból). */
  initialInput?: QuoteInput;
  /** A ?from= forrás-quote: DRAFT → szerkesztés; egyébként másolat-alap. */
  sourceQuote?: CalculatorSourceQuote;
}) {
  const router = useRouter();
  const [input, setInput] = useState<QuoteInput>(initialInput ?? emptyQuoteInput());
  const [rate, setRate] = useState<RateCard>(initialRate);
  const setTierRate = (tier: QuoteTier, patchRate: Partial<RateCard["tiers"][QuoteTier]>) =>
    setRate({ ...rate, tiers: { ...rate.tiers, [tier]: { ...rate.tiers[tier], ...patchRate } } });
  const [saved, setSaved] = useState(storedRate);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showRates, setShowRates] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── CRM-mentés állapota ──────────────────────────────────────────
  const draftMode = sourceQuote?.status === "DRAFT";
  const today = new Date().toISOString().slice(0, 10);
  const [quoteTitle, setQuoteTitle] = useState(
    sourceQuote?.title ??
      (deal ? `${deal.company ?? deal.contactName} – ${today}` : ""),
  );
  const [validUntilDay, setValidUntilDay] = useState(
    sourceQuote?.validUntil ? isoToDayInput(sourceQuote.validUntil) : "",
  );
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [savedQuote, setSavedQuote] = useState<{ id: string; label: string } | null>(null);
  const [markingSent, setMarkingSent] = useState(false);

  const result = useMemo(() => calculateQuote(input, rate), [input, rate]);

  const patch = (changes: Partial<QuoteInput>) => {
    // Bemenet-változás után a „mentve" állapot már nem igaz erre a számításra.
    setSavedQuote(null);
    setInput((current) => ({ ...current, ...changes }));
  };

  async function saveQuote() {
    if (!deal || quoteSaving) return;
    // Kliens-oldali előszűrés a szerver zod-sémájával – pl. a fél workshop-nap
    // a sandboxban számolható, de menteni csak egész napokat lehet.
    const parsed = quoteInputSchema.safeParse(input);
    if (!parsed.success) {
      const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
      setQuoteError(
        `A mentéshez érvényes (egész számú) bemenet kell – ellenőrizd: ${fields.join(", ")}`,
      );
      return;
    }
    setQuoteSaving(true);
    setQuoteError(null);

    if (draftMode && sourceQuote) {
      // DRAFT-szerkesztés: input-frissítés (a szerver friss díjtételekkel
      // újraszámol), plusz érvényesség-állítás, ha változott.
      const updated = await crmRequest(
        `/api/admin/crm/quotes/${sourceQuote.id}`,
        { method: "PATCH", body: { action: "update_input", input: parsed.data } },
      );
      if (!updated.ok) {
        setQuoteSaving(false);
        setQuoteError(updated.error);
        return;
      }
      const originalDay = sourceQuote.validUntil ? isoToDayInput(sourceQuote.validUntil) : "";
      if (validUntilDay !== originalDay) {
        await crmRequest(`/api/admin/crm/quotes/${sourceQuote.id}`, {
          method: "PATCH",
          body: {
            action: "set_valid_until",
            validUntil: validUntilDay ? dayInputToIso(validUntilDay) : null,
          },
        });
      }
      setQuoteSaving(false);
      setSavedQuote({ id: sourceQuote.id, label: sourceQuote.label });
      router.refresh();
      return;
    }

    const created = await crmRequest<{
      quote: { id: string; quoteNo: number; createdAt: string };
    }>("/api/admin/crm/quotes", {
      method: "POST",
      body: {
        dealId: deal.id,
        ...(quoteTitle.trim() ? { title: quoteTitle.trim() } : {}),
        ...(validUntilDay ? { validUntil: dayInputToIso(validUntilDay) } : {}),
        input: parsed.data,
      },
    });
    setQuoteSaving(false);
    if (!created.ok) {
      setQuoteError(created.error);
      return;
    }
    setSavedQuote({
      id: created.data.quote.id,
      label: formatQuoteNo(created.data.quote.quoteNo, new Date(created.data.quote.createdAt)),
    });
    router.refresh();
  }

  async function markSavedQuoteSent() {
    if (!deal || !savedQuote || markingSent) return;
    setMarkingSent(true);
    setQuoteError(null);
    const response = await crmRequest(`/api/admin/crm/quotes/${savedQuote.id}`, {
      method: "PATCH",
      body: {
        action: "mark_sent",
        ...(validUntilDay ? { validUntil: dayInputToIso(validUntilDay) } : {}),
      },
    });
    setMarkingSent(false);
    if (!response.ok) {
      setQuoteError(response.error);
      return;
    }
    router.push(`/admin/crm/${deal.id}`);
  }

  async function saveRates() {
    setSaving(true);
    setSaveError(null);
    let userMessage = t(presentUserError({ code: "NETWORK_ERROR" }), "hu");
    try {
      const res = await fetch("/api/admin/quote/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rate),
      });
      await res.json();
      if (!res.ok) {
        userMessage = t(
          presentUserError({ status: res.status, fallbackKey: "userErrors.saveFailed" }),
          "hu",
        );
        throw new Error("RATE_SAVE_FAILED");
      }
      setSaved(true);
    } catch {
      setSaveError(userMessage);
    } finally {
      setSaving(false);
    }
  }

  // Ajánlat-szöveg: a vevőnek szánt összefoglaló. SZÁNDÉKOSAN nincs benne
  // óradíj, fedezet és kedvezmény-százalék – azok belső számok. Mentés után
  // a sorszám (quoteNo) és az érvényesség is bekerül.
  const quoteText = useMemo(() => {
    const rows = result.lines
      .filter((line) => line.key !== "travel")
      .map((line) => `· ${line.label}: ${huf(line.amount)}`);
    const includes = QUOTE_TIER_INCLUDES[input.tier].map((item) => `  – ${item}`);
    const parts = [
      `Ajánlat${savedQuote ? ` (${savedQuote.label})` : ""} – ${QUOTE_TIER_LABELS[input.tier]}, ${input.headcount} fő, ${input.teams} csapat`,
      "",
      "A program tartalma:",
      ...includes,
      "",
      ...rows,
      result.passThroughSubtotal > 0
        ? `· Kiszállás (továbbhárított): ${huf(result.passThroughSubtotal)}`
        : null,
      "",
      result.discountAmount > 0
        ? `Kedvezmény${input.discountKind ? ` (${DISCOUNT_LABELS[input.discountKind]})` : ""}: −${huf(result.discountAmount)}`
        : null,
      `Nettó programdíj: ${huf(result.netTotal)}`,
      `ÁFA (${input.vatRate}%): ${huf(result.vatAmount)}`,
      `Bruttó programdíj: ${huf(result.grossTotal)}`,
      result.retainerTotal > 0
        ? `Havi kísérés: ${huf(rate.retainerMonthlyFee)} / hó, ${input.retainerMonths} hónap`
        : null,
      "",
      validUntilDay ? `Az ajánlat érvényes: ${formatDay(dayInputToIso(validUntilDay))}-ig.` : null,
      "Minden mérés benne van – a mérések száma nem növeli az árat.",
      "A díjak nettó összegek. A számlázás átutalással történik.",
    ].filter((row): row is string => row !== null);
    return parts.join("\n");
  }, [input, rate.retainerMonthlyFee, result, savedQuote, validUntilDay]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ── Bemenetek ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
          <h2 className="font-fraunces text-lg text-ink">Program</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
            A publikus árlétra két szintje. Minden mérés benne van; a több mérés
            több magyarázatot igényel, ami a workshop-időben jön vissza.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QUOTE_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                aria-pressed={input.tier === tier}
                onClick={() => patch({ tier })}
                className={`min-h-[44px] rounded-lg border px-3 py-2 text-left text-sm transition ${
                  input.tier === tier
                    ? "border-sage bg-sage-soft text-ink"
                    : "border-sand bg-surface-card text-muted hover:border-bronze-edge"
                }`}
              >
                <span className="block font-semibold">{QUOTE_TIER_LABELS[tier]}</span>
                <span className="block text-xs text-muted">
                  {huf(rate.tiers[tier].perHead * rate.firstBandHeads)} alapdíj · {rate.firstBandHeads} fő felett {huf(rate.tiers[tier].perHeadOver)} / fő · további csapat {huf(rate.tiers[tier].additionalTeamFee)}
                </span>
              </button>
            ))}
          </div>
          <ul className="mt-3 flex flex-col gap-1 text-xs leading-relaxed text-ink-body">
            {QUOTE_TIER_INCLUDES[input.tier].map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>
        </section>

        <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
          <h2 className="font-fraunces text-lg text-ink">A szint tartalmán felül</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
            További egész napos, helyszíni workshop; további mérési kör (a fejenkénti díj{" "}
            {rate.extraWaveRatePct}%-áért); havi kísérés; kiszállás (továbbhárítva).
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <NumberField
              label="További workshop-nap"
              value={input.extraWorkshopDays}
              onChange={(extraWorkshopDays) => patch({ extraWorkshopDays })}
              suffix="nap"
            />
            <NumberField
              label="További mérési kör"
              value={input.extraWaves}
              onChange={(extraWaves) => patch({ extraWaves })}
              suffix="db"
            />
            <NumberField
              label="Havi kísérés"
              value={input.retainerMonths}
              onChange={(retainerMonths) => patch({ retainerMonths })}
              suffix="hó"
            />
            <NumberField
              label="Kiszállás"
              value={input.travelDays}
              onChange={(travelDays) => patch({ travelDays })}
              suffix="nap"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
          <h2 className="font-fraunces text-lg text-ink">Kedvezmény</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
            Nevesített, lejáró kedvezmény – ad-hoc alku helyett. Keret:{" "}
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
                    : "border-sand bg-surface-card text-muted hover:border-bronze-edge"
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
                className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none focus:border-bronze"
              />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px_120px]">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Egyéb tétel neve
              </span>
              <input
                type="text"
                value={input.otherFeeLabel}
                maxLength={120}
                onChange={(event) => patch({ otherFeeLabel: event.target.value })}
                className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none focus:border-bronze"
              />
            </label>
            <NumberField
              label="Egyéb tétel"
              value={input.otherFee}
              step={5_000}
              onChange={(otherFee) => patch({ otherFee })}
              suffix="Ft"
            />
            <NumberField
              label="ÁFA"
              value={input.vatRate}
              onChange={(vatRate) => patch({ vatRate })}
              suffix="%"
            />
          </div>
        </section>

        {/* ── Díjtételek ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-fraunces text-lg text-ink">Díjtételek</h2>
            <button
              type="button"
              onClick={() => setShowRates((open) => !open)}
              className="inline-flex min-h-[44px] items-center text-sm text-[var(--color-accent-primary-strong)] underline underline-offset-2"
            >
              {showRates ? "Elrejtem" : "Szerkesztem"}
            </button>
          </div>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
            A minimumdíjak, a létszámsáv, a további csapat, a workshop-nap és a pilot-kedvezmény
            PUBLIKUSAK: az /pricing kalkulátor, a főoldal és a /team-dynamics ár-horgonya, a /pilot
            ténysáv ezekből mutat számot. Mentés után a publikus oldalak azonnal frissülnek.
            Az óra-becslés, a cél-óradíj és a kedvezmény-keret belső.
          </p>
          {!saved && (
            <p className="mt-2 rounded-lg border border-bronze-edge bg-bronze-soft/40 p-3 text-xs leading-relaxed text-ink-body">
              Még a beépített alapértelmezett díjkártya él (nincs mentett, vagy a mentett
              a régi, programdíjas formában van). Ellenőrizd, és mentsd el.
            </p>
          )}

          {showRates && (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Publikus árlétra (nettó Ft)
                </p>
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {QUOTE_TIERS.map((tier) => (
                    <div key={tier} className="rounded-xl border border-sand bg-cream p-3">
                      <p className="text-sm font-semibold text-ink">{QUOTE_TIER_LABELS[tier]}</p>
                      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <NumberField
                          label={`Alapdíj osztója · ${rate.firstBandHeads} fő`}
                          value={rate.tiers[tier].perHead}
                          step={1_000}
                          onChange={(perHead) => setTierRate(tier, { perHead })}
                          suffix="Ft/fő"
                        />
                        <NumberField
                          label="Felette"
                          value={rate.tiers[tier].perHeadOver}
                          step={1_000}
                          onChange={(perHeadOver) => setTierRate(tier, { perHeadOver })}
                          suffix="Ft/fő"
                        />
                        <NumberField
                          label="További csapat"
                          value={rate.tiers[tier].additionalTeamFee}
                          step={10_000}
                          onChange={(additionalTeamFee) => setTierRate(tier, { additionalTeamFee })}
                          suffix="Ft/csapat"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <NumberField
                  label="Sávhatár"
                  value={rate.firstBandHeads}
                  min={1}
                  onChange={(firstBandHeads) => setRate({ ...rate, firstBandHeads })}
                  suffix="fő"
                />
                <NumberField
                  label="Pilot-kedvezmény (publikus)"
                  value={rate.pilotDiscountPct}
                  step={5}
                  onChange={(pilotDiscountPct) => setRate({ ...rate, pilotDiscountPct })}
                  suffix="%"
                />
                <NumberField
                  label="További workshop-nap (publikus)"
                  value={rate.extraWorkshopDayFee}
                  step={10_000}
                  onChange={(extraWorkshopDayFee) => setRate({ ...rate, extraWorkshopDayFee })}
                  suffix="Ft"
                />
                <NumberField
                  label="További mérési kör"
                  value={rate.extraWaveRatePct}
                  step={5}
                  onChange={(extraWaveRatePct) => setRate({ ...rate, extraWaveRatePct })}
                  suffix="% a fejenkénti díjból"
                />
                <NumberField
                  label="Havi kísérés"
                  value={rate.retainerMonthlyFee}
                  step={10_000}
                  onChange={(retainerMonthlyFee) => setRate({ ...rate, retainerMonthlyFee })}
                  suffix="Ft/hó"
                />
                <NumberField
                  label="Kiszállás-nap"
                  value={rate.travelDayFee}
                  step={5_000}
                  onChange={(travelDayFee) => setRate({ ...rate, travelDayFee })}
                  suffix="Ft"
                />
                <NumberField
                  label="Cél-óradíj (belső)"
                  value={rate.targetHourlyRate}
                  step={1_000}
                  onChange={(targetHourlyRate) => setRate({ ...rate, targetHourlyRate })}
                  suffix="Ft/h"
                />
                <NumberField
                  label="Kedvezmény-keret (belső)"
                  value={rate.maxDiscountPct}
                  step={5}
                  onChange={(maxDiscountPct) => setRate({ ...rate, maxDiscountPct })}
                  suffix="%"
                />
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Óra-becslés (a fedezet-számításhoz)
                </p>
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {(
                    [
                      ["setup", "Setup, kampány"],
                      ["perTeam", "Csapatonként"],
                      ["perTenHeads", "10 főnként"],
                      ["onlineDebrief", "Online értelmezés"],
                      ["halfDayWorkshop", "Félnapos workshop"],
                      ["followUp", "Utánkövető mérés"],
                      ["perExtraWorkshopDay", "További workshop-nap"],
                      ["perExtraWave", "További mérési kör"],
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
        <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
          <SectionEyebrow>ajánlat</SectionEyebrow>

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

          <p className="mt-3 border-t border-sand pt-3 text-sm text-ink-body">Nettó programdíj</p>
          <p className="font-fraunces text-3xl tabular-nums text-ink">
            {huf(result.netTotal)}
          </p>
          <p className="mt-1 flex items-baseline justify-between gap-3 text-sm text-muted">
            <span>ÁFA ({input.vatRate}%)</span>
            <span className="tabular-nums">{huf(result.vatAmount)}</span>
          </p>
          <p className="mt-2 flex items-baseline justify-between gap-3 border-t border-sand pt-2 text-sm font-semibold text-ink">
            <span>Bruttó programdíj</span>
            <span className="tabular-nums">{huf(result.grossTotal)}</span>
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

        {/* ── CRM-mentés (csak deal-kontextusban; nélküle sandbox) ── */}
        {deal && (
          <section className="rounded-2xl border border-sand bg-surface-card p-5 shadow-sm">
            <SectionEyebrow>mentés a dealhez</SectionEyebrow>
            <p className="mt-2 text-xs leading-relaxed text-ink-body">
              {draftMode && sourceQuote
                ? `Piszkozat szerkesztése: ${sourceQuote.label} – a mentés a friss díjtételekkel újraszámolva frissíti.`
                : sourceQuote
                  ? `Másolat-alap: ${sourceQuote.label} – a mentés ÚJ piszkozatot hoz létre friss díjtételekkel.`
                  : `Új piszkozat a dealhez: ${deal.title}.`}
            </p>

            {savedQuote ? (
              <div className="mt-3 rounded-xl border border-state-success-border bg-state-success-bg p-3">
                <p className="text-sm font-semibold text-state-success-fg">
                  Mentve: {savedQuote.label}
                </p>
                <p className="mt-1 text-xs text-ink-body">
                  A vevő-szöveg lentről másolható (sorszámmal, belső számok
                  nélkül). Kiküldés után jelöld kiküldöttnek – onnantól az
                  ajánlat nem módosítható, csak másolható.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={markingSent}
                    onClick={() => void markSavedQuoteSent()}
                    className="min-h-[44px] rounded-lg bg-action-primary-bg px-4 text-sm font-semibold text-action-primary-fg transition hover:bg-action-primary-bg-hover disabled:opacity-60"
                  >
                    Megjelölés kiküldöttnek
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/crm/${deal.id}`)}
                    className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-4 text-sm font-semibold text-ink-body transition hover:bg-cream"
                  >
                    Deal megnyitása
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {!draftMode && (
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-xs uppercase tracking-widest text-muted">
                      Ajánlat címe
                    </span>
                    <input
                      type="text"
                      value={quoteTitle}
                      onChange={(event) => setQuoteTitle(event.target.value)}
                      maxLength={200}
                      className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none focus:border-bronze"
                    />
                  </label>
                )}
                <label className="flex flex-col gap-1 sm:max-w-[220px]">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    Érvényes eddig
                  </span>
                  <input
                    type="date"
                    value={validUntilDay}
                    onChange={(event) => setValidUntilDay(event.target.value)}
                    className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none focus:border-bronze"
                  />
                  <span className="text-xs text-muted">
                    Üresen: kiküldéskor automatikusan +30 nap.
                  </span>
                </label>
                <button
                  type="button"
                  disabled={quoteSaving}
                  onClick={() => void saveQuote()}
                  className="min-h-[44px] self-start rounded-lg bg-action-primary-bg px-5 text-sm font-semibold text-action-primary-fg transition hover:bg-action-primary-bg-hover disabled:opacity-60"
                >
                  {draftMode ? "Piszkozat frissítése" : "Mentés ajánlatként"}
                </button>
              </div>
            )}

            {quoteError && (
              <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
                {quoteError}
              </p>
            )}
          </section>
        )}

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
            {result.effectiveHourlyRate == null ? "–" : huf(result.effectiveHourlyRate)}
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

        <section className="rounded-2xl border border-sand bg-surface-card p-5 shadow-sm">
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
              className="inline-flex min-h-[44px] shrink-0 items-center text-xs text-[var(--color-accent-primary-strong)] underline underline-offset-2"
            >
              {copied ? "Másolva" : "Másolás"}
            </button>
          </div>
          {/* Belső számok (óradíj, fedezet, kedvezmény-keret) SZÁNDÉKOSAN
              nincsenek benne – ez a szöveg a vevőnek megy. */}
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
