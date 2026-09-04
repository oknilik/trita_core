"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/LocaleProvider";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { LocalizedPageMeta } from "@/components/marketing/LocalizedPageMeta";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { t, tf, type Locale } from "@/lib/i18n/public";
import { PILOT_SPOTS_LEFT, PILOT_TOTAL_TEAMS } from "@/lib/pilot-config";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { TritaWordmark } from "@/components/TritaLogo";
import { track } from "@/lib/analytics/client";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { ChevronRightIcon } from "@/components/ui/icons";

const INPUT_CLASS = "w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-[var(--color-layer-team-accent)]/40 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-[var(--color-layer-team-accent)]/10";

type PilotFormValues = { name: string; email: string; company: string; size: string; message: string };
type PilotField = keyof PilotFormValues;
type PilotFieldErrors = Partial<Record<PilotField, string>>;

const PILOT_VALIDATION_COPY: Record<
  Locale,
  Record<"name" | "email" | "company" | "size" | "message", string>
> = {
  hu: {
    name: "Adj meg egy 2–100 karakteres nevet.",
    email: "Adj meg egy érvényes email címet.",
    company: "A cégnév 1–120 karakter lehet.",
    size: "A csapatméret legfeljebb 60 karakter lehet.",
    message: "A kérdés legfeljebb 4000 karakter lehet.",
  },
  en: {
    name: "Enter a name between 2 and 100 characters.",
    email: "Enter a valid email address.",
    company: "The company name must be between 1 and 120 characters.",
    size: "The team size can be at most 60 characters.",
    message: "The question can be at most 4000 characters.",
  },
};

const PILOT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PartnerVisual({ locale }: { locale: Locale }) {
  return (
    <aside
      aria-label={t("pilot.partnerVisualA11y", locale)}
      className="relative overflow-hidden rounded-[28px] bg-[var(--color-layer-team-hero-to)] p-5 text-white shadow-[0_28px_80px_rgba(26,26,46,0.17)] md:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-44 opacity-20"
      >
        <svg viewBox="0 0 176 112" className="size-full">
          <path
            d="M5 88 C36 8 65 112 102 40 C126 -5 151 49 171 10"
            fill="none"
            stroke="var(--color-layer-team-badge)"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div aria-hidden="true" className="relative">
        <div className="mb-5">
          <p className="text-label uppercase tracking-[0.12em] text-white/65">
            {t("pilot.partnerVisualEyebrow", locale)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.055] p-4">
            <div className="flex size-16 shrink-0 self-center items-center justify-center rounded-[46%_54%_48%_52%/54%_45%_55%_46%] border border-white/15 bg-[var(--color-layer-self-hero-from)] shadow-[0_12px_26px_rgba(0,0,0,0.16)]">
              <span className="font-fraunces text-lg text-white">Ti</span>
            </div>
            <div className="min-w-0">
              <p className="min-w-0 break-words text-sm leading-snug text-white/85 [overflow-wrap:anywhere]">
                {t("pilot.partnerTeamBody", locale)}
              </p>
            </div>
          </article>

          <article className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.055] p-4">
            <div className="flex size-16 shrink-0 self-center items-center justify-center rounded-[54%_46%_52%_48%/45%_55%_46%_54%] border border-white/15 bg-[var(--color-layer-team-hero-from)] shadow-[0_12px_26px_rgba(0,0,0,0.16)]">
              <TritaWordmark className="text-[1.15rem] text-white" />
            </div>
            <div className="min-w-0">
              <p className="min-w-0 break-words text-sm leading-snug text-white/85 [overflow-wrap:anywhere]">
                {t("pilot.partnerTritaBody", locale)}
              </p>
            </div>
          </article>
        </div>

        <article className="relative mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-cream p-5 text-ink shadow-[0_22px_48px_rgba(0,0,0,0.20)] md:p-6">
          <div aria-hidden="true" className="absolute -right-8 -top-10 size-28 rotate-12 rounded-[46%_54%_39%_61%] bg-[var(--color-layer-team-soft)]/45" />

          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="max-w-[16ch] font-fraunces text-title text-ink md:text-display">
                {t("pilot.partnerResultTitle", locale)}
              </h3>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[13px_20px_14px_18px] bg-[var(--color-layer-team-badge)] font-fraunces text-sm text-[var(--color-layer-team-hero-to)]">
              ✦
            </span>
          </div>

          <svg
            viewBox="0 0 420 78"
            preserveAspectRatio="none"
            className="relative my-4 h-[74px] w-full overflow-visible"
          >
            <path
              d="M4 51 C41 51 44 17 83 17 C122 17 125 64 164 64 C181 64 191 50 210 41"
              fill="none"
              stroke="var(--color-layer-self-hero-from)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
            />
            <path
              d="M416 51 C379 51 376 23 337 23 C298 23 295 61 256 61 C239 61 228 49 210 41"
              fill="none"
              stroke="var(--color-layer-team-hero-from)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
            />
            <path
              d="M210 41 C237 8 269 10 294 40 C319 69 349 66 376 44 C391 32 404 37 416 37"
              fill="none"
              stroke="var(--color-layer-team-badge)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="7"
            />
            <circle cx="210" cy="41" r="7" fill="var(--color-layer-team-badge)" />
          </svg>

          <p className="relative max-w-[38rem] text-sm leading-relaxed text-ink-body">
            {t("pilot.partnerVisualNote", locale)}
          </p>
        </article>
      </div>
    </aside>
  );
}

export function PilotContent() {
  const { locale } = useLocale();
  const fieldIdPrefix = useId().replaceAll(":", "");
  const [form, setForm] = useState<PilotFormValues>({ name: "", email: "", company: "", size: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<PilotFieldErrors>({});
  const formStarted = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Az async hiba state commitja utan a gomb mar biztosan nincs disabled
  // allapotban. A catch-bol inditott rAF React concurrent render mellett
  // megelozhette ezt a commitot, ilyenkor a focus() csendben hatastalan volt.
  useEffect(() => {
    if (status === "error") submitRef.current?.focus();
  }, [status]);

  // Űrlap első érintése — a pilot-tölcsér eddig mérétlen volt (P1.2).
  const handleFormStart = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    track("form.start", { form_id: "pilot_apply" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (status === "error") setStatus("idle");

    const nextFieldErrors = validatePilotFields(form, locale);
    setFieldErrors(nextFieldErrors);
    const firstInvalidField = (["name", "email", "company", "size", "message"] as const).find(
      (field) => nextFieldErrors[field],
    );
    if (firstInvalidField) {
      ({
        name: nameRef,
        email: emailRef,
        company: companyRef,
        size: sizeRef,
        message: messageRef,
      })[firstInvalidField].current?.focus();
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/pilot-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });

      if (!res.ok) throw new Error("Failed");
      track("form.submit", { form_id: "pilot_apply", outcome: "success" });
      setStatus("sent");
    } catch {
      track("form.submit", { form_id: "pilot_apply", outcome: "error" });
      setStatus("error");
    }
  };

  const updateFormField = (field: PilotField, value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    if (!fieldErrors[field]) return;
    const nextError = validatePilotFields(nextForm, locale)[field];
    setFieldErrors((current) => ({ ...current, [field]: nextError }));
  };

  return (
    <main className="overflow-hidden bg-cream text-ink selection:bg-bronze/20">
      <LocalizedPageMeta titleKey="pilot.metaTitle" descriptionKey="pilot.metaDescription" />
      <section className="relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[4%] top-[4%] h-[78%] w-[48%] rounded-full bg-[var(--color-layer-team-soft)]/75 blur-3xl"
        />
        <div className="relative mx-auto max-w-[1120px] px-7 pb-20 pt-12 md:pb-28 md:pt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <SectionEyebrow tone="team">{t("pilot.eyebrow", locale)}</SectionEyebrow>
                <span className="inline-flex items-center rounded-full border border-[var(--color-layer-team-accent)]/20 bg-surface-card/75 px-4 py-1.5 text-caption font-medium text-[var(--color-layer-team-accent)] backdrop-blur-sm">
                  {tf("pilot.badge", locale, { total: PILOT_TOTAL_TEAMS })}
                </span>
              </div>

              <h1 className="max-w-[13ch] font-fraunces text-fluid-display tracking-tight text-ink">
                {t("pilot.heroTitle", locale)}
                <em className="text-[var(--color-layer-team-accent)]">
                  {t("pilot.heroTitleEm", locale)}
                </em>
              </h1>

              <p className="mt-6 max-w-[610px] text-base leading-relaxed text-ink-body">
                {t("pilot.heroBody", locale)}
              </p>

              <MarketingActions
                className="mt-8"
                primary={{ href: "#jelentkezes", label: t("pilot.heroCta", locale) }}
              />

              <SpotsIndicator locale={locale} />

              <div className="mt-6 flex flex-wrap gap-2.5">
                <MetaChip>{t("pilot.metaChip1", locale)}</MetaChip>
                <MetaChip>{t("pilot.metaChip2", locale)}</MetaChip>
                <MetaChip>{t("pilot.metaChip3", locale)}</MetaChip>
              </div>
            </div>

            <PartnerVisual locale={locale} />
          </div>
        </div>
      </section>

      <PilotFactBar locale={locale} />

      <EditorialSection
        eyebrow={t("pilot.exchangeEyebrow", locale)}
        title={t("pilot.exchangeTitle", locale)}
        tone="warm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <ExchangeCard
            label={t("pilot.exchangeGiveLabel", locale)}
            title={t("pilot.exchangeGiveTitle", locale)}
            items={[
              t("pilot.exchangeGive1", locale),
              t("pilot.exchangeGive2", locale),
              t("pilot.exchangeGive3", locale),
            ]}
          />
          <ExchangeCard
            label={t("pilot.exchangeAskLabel", locale)}
            title={t("pilot.exchangeAskTitle", locale)}
            items={[
              t("pilot.exchangeAsk1", locale),
              t("pilot.exchangeAsk2", locale),
              t("pilot.exchangeAsk3", locale),
            ]}
            tone="soft"
          />
        </div>
      </EditorialSection>

      <FounderSection locale={locale} />

      {/* A háttér a közös vászonszín: a footer hullám előtti védősáv is
          ebből él (--color-surface-canvas = cream), így az oldal alján nem
          jelenik meg eltérő színű csík a hullám fölött. */}
      <section id="jelentkezes" className="bg-cream">
        <PageWidthDivider />
        <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <SectionEyebrow tone="team" className="mb-4">{t("pilot.formEyebrow", locale)}</SectionEyebrow>
            <h2 className="font-fraunces text-fluid-title tracking-tight text-ink">
              {t("pilot.formTitle", locale)}
            </h2>
            <p className="mt-5 max-w-[28rem] text-base leading-8 text-ink-body">
              {t("pilot.formBody", locale)}
            </p>
            <div className="mt-7 rounded-[20px] border border-[var(--color-layer-team-accent)]/20 bg-surface-card/65 px-5 py-5">
              <p className="text-label uppercase text-[var(--color-layer-team-accent)]">
                {t("pilot.fitEyebrow", locale)}
              </p>
              <p className="mt-2 text-sm leading-7 text-ink-body">
                {t("pilot.fitBody", locale)}
              </p>
            </div>
            <p className="mt-5 text-sm leading-6 text-ink-body">
              {t("pilot.privacyNote", locale)}
              <a
                href="/privacy"
                className="mt-1 block w-fit font-medium text-sage transition-colors hover:text-sage-dark"
              >
                {t("pilot.privacyNoteLink", locale)}
              </a>
            </p>
          </div>

          <div className="rounded-[28px] border border-sand bg-surface-card p-6 shadow-[0_24px_70px_rgba(26,26,46,0.08)] md:p-8">
            {status === "sent" ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-[22px] border border-sage/15 bg-sage-soft px-6 py-10 text-center"
              >
                <div className="font-fraunces text-5xl leading-none text-bronze">+</div>
                <h3 className="mt-4 font-fraunces text-display text-ink">
                  {t("pilot.successTitle", locale)}
                </h3>
                <p className="mt-3 text-base leading-8 text-ink-body">
                  {t("pilot.successBody", locale)}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 border-b border-sand pb-5">
                  <p className="font-fraunces text-title leading-tight text-ink">{t("pilot.formHeading", locale)}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-body">
                    {t("pilot.formSubheading", locale)}
                  </p>
                  {PILOT_SPOTS_LEFT > 0 ? (
                    <p className="mt-2 text-sm font-medium text-[var(--color-layer-team-accent)]">
                      {tf("pilot.formSpotsNote", locale, {
                        total: PILOT_TOTAL_TEAMS,
                        left: PILOT_SPOTS_LEFT,
                      })}
                    </p>
                  ) : null}
                </div>

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  onFocus={handleFormStart}
                  aria-busy={status === "sending" || undefined}
                  aria-describedby={status === "error" ? `${fieldIdPrefix}-pilot-api-error` : undefined}
                  className="grid gap-5"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      id={`${fieldIdPrefix}-pilot-name`}
                      label={t("pilot.labelName", locale)}
                      required
                      error={fieldErrors.name}
                      errorId={`${fieldIdPrefix}-pilot-name-error`}
                    >
                      <input
                        ref={nameRef}
                        id={`${fieldIdPrefix}-pilot-name`}
                        name="name"
                        required
                        minLength={2}
                        maxLength={100}
                        type="text"
                        autoComplete="name"
                        disabled={status === "sending"}
                        aria-invalid={Boolean(fieldErrors.name) || undefined}
                        aria-describedby={fieldErrors.name ? `${fieldIdPrefix}-pilot-name-error` : undefined}
                        value={form.name}
                        onChange={(e) => updateFormField("name", e.target.value)}
                        placeholder={t("pilot.placeholderName", locale)}
                        className={INPUT_CLASS}
                      />
                    </FormField>

                    <FormField
                      id={`${fieldIdPrefix}-pilot-email`}
                      label={t("pilot.labelEmail", locale)}
                      required
                      error={fieldErrors.email}
                      errorId={`${fieldIdPrefix}-pilot-email-error`}
                    >
                      <input
                        ref={emailRef}
                        id={`${fieldIdPrefix}-pilot-email`}
                        name="email"
                        required
                        maxLength={320}
                        type="email"
                        autoComplete="email"
                        disabled={status === "sending"}
                        aria-invalid={Boolean(fieldErrors.email) || undefined}
                        aria-describedby={fieldErrors.email ? `${fieldIdPrefix}-pilot-email-error` : undefined}
                        value={form.email}
                        onChange={(e) => updateFormField("email", e.target.value)}
                        placeholder={t("pilot.placeholderEmail", locale)}
                        className={INPUT_CLASS}
                      />
                    </FormField>
                  </div>

                  <FormField
                    id={`${fieldIdPrefix}-pilot-company`}
                    label={t("pilot.labelCompany", locale)}
                    required
                    error={fieldErrors.company}
                    errorId={`${fieldIdPrefix}-pilot-company-error`}
                  >
                    <input
                      ref={companyRef}
                      id={`${fieldIdPrefix}-pilot-company`}
                      name="company"
                      required
                      maxLength={120}
                      type="text"
                      autoComplete="organization"
                      disabled={status === "sending"}
                      aria-invalid={Boolean(fieldErrors.company) || undefined}
                      aria-describedby={fieldErrors.company ? `${fieldIdPrefix}-pilot-company-error` : undefined}
                      value={form.company}
                      onChange={(e) => updateFormField("company", e.target.value)}
                      placeholder={t("pilot.placeholderCompany", locale)}
                      className={INPUT_CLASS}
                    />
                  </FormField>

                  <FormField
                    id={`${fieldIdPrefix}-pilot-size`}
                    label={t("pilot.labelSize", locale)}
                    error={fieldErrors.size}
                    errorId={`${fieldIdPrefix}-pilot-size-error`}
                  >
                    <select
                      ref={sizeRef}
                      id={`${fieldIdPrefix}-pilot-size`}
                      name="size"
                      disabled={status === "sending"}
                      aria-invalid={Boolean(fieldErrors.size) || undefined}
                      aria-describedby={fieldErrors.size ? `${fieldIdPrefix}-pilot-size-error` : undefined}
                      value={form.size}
                      onChange={(e) => updateFormField("size", e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="">{t("pilot.sizeOption0", locale)}</option>
                      <option value="5-10">{t("pilot.sizeOption1", locale)}</option>
                      <option value="11-25">{t("pilot.sizeOption2", locale)}</option>
                      <option value="26-50">{t("pilot.sizeOption3", locale)}</option>
                      <option value="51-80">{t("pilot.sizeOption4", locale)}</option>
                      <option value="80+">{t("pilot.sizeOption5", locale)}</option>
                    </select>
                  </FormField>

                  <FormField
                    id={`${fieldIdPrefix}-pilot-message`}
                    label={t("pilot.labelQuestion", locale)}
                    error={fieldErrors.message}
                    errorId={`${fieldIdPrefix}-pilot-message-error`}
                  >
                    <textarea
                      ref={messageRef}
                      id={`${fieldIdPrefix}-pilot-message`}
                      name="message"
                      maxLength={4000}
                      disabled={status === "sending"}
                      aria-invalid={Boolean(fieldErrors.message) || undefined}
                      aria-describedby={fieldErrors.message ? `${fieldIdPrefix}-pilot-message-error` : undefined}
                      value={form.message}
                      onChange={(e) => updateFormField("message", e.target.value)}
                      rows={4}
                      placeholder={t("pilot.placeholderQuestion", locale)}
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </FormField>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      ref={submitRef}
                      type="submit"
                      disabled={status === "sending"}
                      className={`inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-7 py-3.5 text-base font-semibold text-[var(--color-action-primary-fg)] transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASS}`}
                    >
                      {status === "sending" ? t("pilot.submitSending", locale) : t("pilot.submitDefault", locale)}
                    </button>
                    <p className="text-sm leading-6 text-ink-body">
                      {t("pilot.preferEmail", locale)}{" "}
                      <a href="mailto:hello@trita.io" className="font-medium text-sage transition-colors hover:text-sage-dark">
                        hello@trita.io
                      </a>
                    </p>
                  </div>

                  {status === "error" && (
                    <p
                      id={`${fieldIdPrefix}-pilot-api-error`}
                      role="alert"
                      className="rounded-xl border border-state-error-border bg-state-error-soft px-4 py-3 text-sm text-state-error-fg"
                    >
                      {t("pilot.errorMessage", locale)}
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// „Ki kísér végig" blokk (P1-1, átalakítva): fotó és életrajz nélkül — a
// bizalmat a személyes vállalás és a módszertani horgony hordozza, nem az
// alapító bemutatása.
function FounderSection({ locale }: { locale: Locale }) {
  return (
    <section className="bg-cream">
      <PageWidthDivider />
      <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
        <div className="grid items-center gap-8 rounded-[28px] border border-sand bg-warm p-6 md:grid-cols-[minmax(0,1fr)_280px] md:p-9">
          <div>
            <SectionEyebrow tone="team">{t("pilot.founderEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-3 max-w-[22ch] font-fraunces text-title text-ink md:text-display">
              {t("pilot.founderTitle", locale)}
            </h2>
            <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-ink-body">
              {t("pilot.founderBody", locale)}
            </p>
            <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-ink-body">
              {t("pilot.founderMethod", locale)}
            </p>
          </div>
          {/* Miró-ihletésű „rétegek" illusztráció: három áttetsző folt
              (személyiség · csapatszerepek · pszichológiai biztonság), a
              metszetükben csillag — a módszertani mondat vizuális párja.
              Minden szín token, így sötét módban is ül. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 300 260"
            className="mx-auto w-full max-w-[260px] md:max-w-none"
          >
            <path
              d="M96 60 C150 26 214 52 216 108 C218 156 168 176 124 164 C78 152 58 86 96 60 Z"
              fill="var(--color-layer-team-badge)"
              opacity=".8"
            />
            <path
              d="M150 108 C214 84 268 118 258 168 C249 212 186 224 146 202 C108 182 104 126 150 108 Z"
              fill="var(--color-sage)"
              opacity=".55"
            />
            <path
              d="M62 128 C104 106 168 122 172 168 C176 210 124 236 84 220 C46 204 28 148 62 128 Z"
              fill="var(--color-layer-team-accent)"
              opacity=".5"
            />
            <path
              d="M96 60 C150 26 214 52 216 108 C218 156 168 176 124 164 C78 152 58 86 96 60 Z"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="4"
            />
            <path
              d="M150 152 l6 14 15 4 -15 6 -6 14 -6-14 -15-6 15-4 z"
              fill="var(--color-surface-inverse)"
            />
            <circle cx="248" cy="52" r="7" fill="var(--color-surface-inverse)" />
            <path
              d="M34 70 Q48 56 66 66"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

// Kapacitás-kártya a hero CTA alatt: a nagy szám és a sötét csapatfelület
// egyetlen döntési ténnyé sűríti a limitált helyeket. A tízrészes sávban az
// első szabad helyre a brand-csillag „érkezik meg"; a többi nyugodt marad.
// A számok a pilot-config.ts-ből jönnek; betelt pilotnál nem renderelődik.
function SpotsIndicator({ locale }: { locale: Locale }) {
  if (PILOT_SPOTS_LEFT <= 0) return null;
  const taken = PILOT_TOTAL_TEAMS - PILOT_SPOTS_LEFT;
  const vars = { total: PILOT_TOTAL_TEAMS, left: PILOT_SPOTS_LEFT, taken };
  return (
    <a
      href="#jelentkezes"
      data-pilot-spots
      aria-label={tf("pilot.spotsA11y", locale, vars)}
      onClick={() => track("cta.click", { cta_id: "hero_spots", surface: "pilot" })}
      className={`group relative mt-6 grid max-w-[600px] grid-cols-[auto_minmax(0,1fr)] items-center gap-4 overflow-hidden rounded-[22px] bg-gradient-to-br from-[var(--color-layer-team-hero-from)] to-[var(--color-layer-team-hero-to)] p-4 text-[var(--color-text-on-inverse)] shadow-[0_18px_44px_color-mix(in_srgb,var(--color-layer-team-hero-to)_22%,transparent)] transition-[translate,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-[1.04] hover:shadow-[0_24px_56px_color-mix(in_srgb,var(--color-layer-team-hero-to)_28%,transparent)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-5 sm:p-5 ${FOCUS_RING_CLASS}`}
    >
      <span className="shrink-0 font-fraunces text-display leading-none tracking-[-0.06em] text-[var(--color-layer-team-badge)] md:text-hero">
        {PILOT_SPOTS_LEFT}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--color-text-on-inverse)] sm:text-base">
          {tf("pilot.spotsPanelTitle", locale, vars)}
        </span>
        <span className="mt-1 block text-note leading-relaxed text-[var(--color-text-on-inverse-muted)]">
          {tf("pilot.spotsPanelUrgency", locale, vars)}
        </span>
        {/* Az első három szelet foglalt, a hét barackszínű szelet szabad.
            Az első szabad hely fölé a brand-csillag érkezik; nincs pulzáló
            gyűrű, ami töltés- vagy hibaállapotnak tűnhetne. */}
        <span aria-hidden="true" className="mt-5 grid grid-cols-10 gap-1.5">
          {Array.from({ length: PILOT_TOTAL_TEAMS }, (_, i) => (
            <span
              key={i}
              data-pilot-spot={i < taken ? "taken" : i === taken ? "next" : "open"}
              data-pilot-spot-effect={i === taken ? "star-arrival" : undefined}
              className={
                i < taken
                  ? "h-1.5 rounded-full bg-[var(--color-text-on-inverse)]/25"
                  : i === taken
                    ? "pilot-spot-next h-1.5 rounded-full bg-[var(--color-layer-team-badge)]"
                    : "h-1.5 rounded-full bg-[var(--color-layer-team-badge)]"
              }
            />
          ))}
        </span>
      </span>
      <span className="col-span-2 inline-flex shrink-0 items-center justify-self-end gap-1 text-sm font-semibold text-[var(--color-layer-team-badge)] sm:col-span-1">
        {t("pilot.spotsPanelCta", locale)}
        <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}

const PILOT_FACTS = [1, 2, 3, 4] as const;

// Ténysáv a hero alatt (P0-1): a nagy szám tipográfiája a /how-we-work
// pilot-teaser „90 NAP" motívumát követi (font-fraunces + text-label unit).
function PilotFactBar({ locale }: { locale: Locale }) {
  return (
    <section aria-label={t("pilot.factsA11y", locale)} className="bg-cream">
      <div className="mx-auto max-w-[1120px] px-7 pb-16 md:pb-24">
        <dl className="grid grid-cols-2 overflow-hidden rounded-[24px] border border-sand bg-surface-card shadow-[0_16px_40px_rgba(26,26,46,0.05)] lg:grid-cols-4">
          {PILOT_FACTS.map((fact) => {
            const vars = { total: PILOT_TOTAL_TEAMS, left: PILOT_SPOTS_LEFT };
            const unit = tf(`pilot.fact${fact}Unit`, locale, vars);
            return (
              <div
                key={fact}
                className={`border-b border-l border-sand p-5 first:border-l-0 md:p-6 max-lg:odd:border-l-0 lg:border-b-0 max-lg:[&:nth-child(n+3)]:border-b-0 ${
                  fact === 2 ? "bg-[var(--color-layer-team-soft)]/45" : ""
                }`}
              >
                <dd className="flex items-baseline gap-1.5">
                  <span className="font-fraunces text-display leading-none text-[var(--color-layer-team-accent)] md:text-hero">
                    {tf(`pilot.fact${fact}Value`, locale, vars)}
                  </span>
                  {unit ? (
                    <span className="text-label uppercase text-[var(--color-layer-team-accent)]">
                      {unit}
                    </span>
                  ) : null}
                </dd>
                <dt className="mt-2 text-sm leading-relaxed text-ink-body">
                  {tf(`pilot.fact${fact}Label`, locale, vars)}
                </dt>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

function EditorialSection({
  id,
  eyebrow,
  title,
  children,
  tone = "default",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  tone?: "default" | "warm";
}) {
  return (
    <section id={id} className={tone === "warm" ? "bg-warm" : "bg-cream"}>
      <PageWidthDivider />
      <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <SectionEyebrow tone={tone === "warm" ? "team" : "bronze"}>{eyebrow}</SectionEyebrow>
        </div>
        <div>
          <h2 className="max-w-[13ch] font-fraunces text-fluid-title tracking-tight text-ink">
            {title}
          </h2>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sand bg-surface-card px-3 py-1.5 text-sm text-ink-body">
      {children}
    </span>
  );
}

function FormField({
  id,
  label,
  required,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        <span>
          {label}
          {required && (
            <span
              aria-hidden="true"
              className="ml-1 text-[var(--color-accent-primary-strong)]"
            >
              *
            </span>
          )}
        </span>
      </label>
      {children}
      {error ? (
        <span id={errorId} className="mt-2 block text-xs text-state-error-fg">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function validatePilotFields(values: PilotFormValues, locale: Locale): PilotFieldErrors {
  const copy = PILOT_VALIDATION_COPY[locale];
  const errors: PilotFieldErrors = {};
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();
  const trimmedCompany = values.company.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) errors.name = copy.name;
  if (!PILOT_EMAIL_PATTERN.test(trimmedEmail) || trimmedEmail.length > 320) {
    errors.email = copy.email;
  }
  if (trimmedCompany.length < 1 || trimmedCompany.length > 120) {
    errors.company = copy.company;
  }
  if (values.size.trim().length > 60) errors.size = copy.size;
  if (values.message.trim().length > 4000) errors.message = copy.message;

  return errors;
}

function ExchangeCard({
  label,
  title,
  items,
  tone = "team",
}: {
  label: string;
  title: string;
  items: string[];
  tone?: "team" | "soft";
}) {
  return (
    <article
      className={
        tone === "team"
          ? "rounded-[24px] bg-[var(--color-layer-team-hero-from)] p-6 text-[var(--color-text-on-inverse)] shadow-[0_18px_45px_rgba(26,26,46,0.10)] md:p-7"
          : "rounded-[24px] border border-sand bg-surface-card p-6 text-ink shadow-[0_16px_40px_rgba(26,26,46,0.04)] md:p-7"
      }
    >
      <p
        className={
          tone === "team"
            ? "text-label uppercase text-[var(--color-layer-team-badge)]"
            : "text-label uppercase text-[var(--color-layer-team-accent)]"
        }
      >
        {label}
      </p>
      <h3 className="mt-3 font-fraunces text-title leading-tight">{title}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className={
              tone === "team"
                ? "flex gap-3 text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]"
                : "flex gap-3 text-sm leading-relaxed text-ink-body"
            }
          >
            <span
              aria-hidden="true"
              className={
                tone === "team"
                  ? "mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-layer-team-glow)]"
                  : "mt-2 size-1.5 shrink-0 rounded-full bg-bronze"
              }
            />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
