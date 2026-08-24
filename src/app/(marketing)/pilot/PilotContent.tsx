"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { t } from "@/lib/i18n/public";
import { ChevronRightIcon } from "@/components/ui/icons";
import { track } from "@/lib/analytics/client";

export function PilotContent() {
  const { locale } = useLocale();
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const formStarted = useRef(false);

  // Űrlap első érintése — a pilot-tölcsér eddig mérétlen volt (P1.2).
  const handleFormStart = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    track("form.start", { form_id: "pilot_apply" });
  };

  const benefitGroups = [
    [
      { number: "01", title: t("pilot.benefit1Title", locale), desc: t("pilot.benefit1Desc", locale) },
      { number: "02", title: t("pilot.benefit2Title", locale), desc: t("pilot.benefit2Desc", locale) },
      { number: "03", title: t("pilot.benefit3Title", locale), desc: t("pilot.benefit3Desc", locale) },
    ],
    [
      { number: "04", title: t("pilot.benefit4Title", locale), desc: t("pilot.benefit4Desc", locale) },
      { number: "05", title: t("pilot.benefit5Title", locale), desc: t("pilot.benefit5Desc", locale) },
      { number: "06", title: t("pilot.benefit6Title", locale), desc: t("pilot.benefit6Desc", locale) },
    ],
  ];

  const steps = [
    { step: "01", title: t("pilot.step1Title", locale), desc: t("pilot.step1Desc", locale) },
    { step: "02", title: t("pilot.step2Title", locale), desc: t("pilot.step2Desc", locale) },
    { step: "03", title: t("pilot.step3Title", locale), desc: t("pilot.step3Desc", locale) },
  ];

  const commitments = [
    { title: t("pilot.commitment1Title", locale), desc: t("pilot.commitment1Desc", locale) },
    { title: t("pilot.commitment2Title", locale), desc: t("pilot.commitment2Desc", locale) },
    { title: t("pilot.commitment3Title", locale), desc: t("pilot.commitment3Desc", locale) },
  ];

  const signals = [
    { value: t("pilot.signal1Value", locale), label: t("pilot.signal1Label", locale) },
    { value: t("pilot.signal2Value", locale), label: t("pilot.signal2Label", locale) },
    { value: t("pilot.signal3Value", locale), label: t("pilot.signal3Label", locale) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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

  return (
    <main className="bg-cream text-ink selection:bg-bronze/20">
      <section>
        <div className="mx-auto max-w-[1120px] px-7 pb-16 pt-12 md:pb-24 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_380px] lg:items-start">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-bronze" />
                <span className="font-dm-sans text-label uppercase text-[var(--color-accent-primary-strong)]">
                  {t("pilot.eyebrow", locale)}
                </span>
              </div>

              <div className="mb-6 inline-flex items-center rounded-full border border-bronze/15 bg-bronze/8 px-4 py-1.5 text-sm font-medium text-[var(--color-accent-primary-strong)]">
                {t("pilot.badge", locale)}
              </div>

              <h1 className="max-w-[11ch] font-fraunces text-[clamp(3rem,8vw,5.2rem)] leading-[0.98] tracking-tight text-ink">
                {t("pilot.heroTitle", locale)}<em className="not-italic text-[var(--color-accent-primary-strong)]">{t("pilot.heroTitleEm", locale)}</em>
              </h1>

              <p className="mt-6 max-w-[620px] text-lg leading-[1.8] text-ink-body md:text-heading">
                {t("pilot.heroBody", locale)}
              </p>

              <MarketingActions
                className="mt-8"
                primary={{ href: "#jelentkezes", label: t("pilot.heroCta", locale) }}
                secondary={{
                  href: "#mit-kapsz",
                  label: t("pilot.heroCtaSecondary", locale),
                  iconRight: <ChevronRightIcon />,
                }}
              />

              <div className="mt-6 flex flex-wrap gap-2.5">
                <MetaChip>{t("pilot.metaChip1", locale)}</MetaChip>
                <MetaChip>{t("pilot.metaChip2", locale)}</MetaChip>
                <MetaChip>{t("pilot.metaChip3", locale)}</MetaChip>
              </div>
            </div>

            <aside className="overflow-hidden rounded-[24px] border border-sand bg-surface-card shadow-[0_24px_60px_rgba(26,26,46,0.06)]">
              <div className="border-b border-sand bg-warm px-6 py-6">
                <p className="font-dm-sans text-label uppercase text-[var(--color-accent-primary-strong)]">
                  {t("pilot.asideEyebrow", locale)}
                </p>
                <p className="mt-3 font-fraunces text-title leading-tight text-ink">
                  {t("pilot.asideTitle", locale)}
                </p>
                <p className="mt-3 text-sm leading-7 text-ink-body">
                  {t("pilot.asideBody", locale)}
                </p>
              </div>

              <div className="grid gap-3 p-5">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {signals.map((signal) => (
                    <div key={signal.label} className="rounded-2xl border border-sand bg-cream px-4 py-4">
                      <div className="font-fraunces text-4xl leading-none text-bronze">{signal.value}</div>
                      <div className="mt-2 text-sm leading-6 text-ink-body">{signal.label}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-sage/15 bg-sage-soft px-5 py-5">
                  <p className="font-dm-sans text-micro font-semibold uppercase tracking-widest text-sage-dark/70">
                    {t("pilot.aside90Eyebrow", locale)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-ink-body">
                    {t("pilot.aside90Body", locale)}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <EditorialSection
        id="mit-kapsz"
        eyebrow={t("pilot.benefitsEyebrow", locale)}
        title={t("pilot.benefitsTitle", locale)}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {benefitGroups.map((group, columnIndex) => (
            <div key={columnIndex} className="grid gap-5">
              {group.map((item) => (
                <FeatureCard key={item.number} {...item} />
              ))}
            </div>
          ))}
        </div>
      </EditorialSection>

      <EditorialSection
        eyebrow={t("pilot.stepsEyebrow", locale)}
        title={t("pilot.stepsTitle", locale)}
      >
        <div className="grid gap-5">
          {steps.map((item) => (
            <StepCard key={item.step} {...item} />
          ))}
        </div>
      </EditorialSection>

      <EditorialSection
        eyebrow={t("pilot.commitmentsEyebrow", locale)}
        title={t("pilot.commitmentsTitle", locale)}
      >
        <div className="grid gap-4">
          {commitments.map((item) => (
            <CommitmentCard key={item.title} {...item} commitmentLabel={t("pilot.commitmentLabel", locale)} />
          ))}
        </div>
      </EditorialSection>

      <section id="jelentkezes">
        <PageWidthDivider />
        <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-bronze" />
              <span className="font-dm-sans text-label uppercase text-[var(--color-accent-primary-strong)]">
                {t("pilot.formEyebrow", locale)}
              </span>
            </div>
            <h2 className="font-fraunces text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.02] tracking-tight text-ink">
              {t("pilot.formTitle", locale)}
            </h2>
            <p className="mt-5 max-w-[28rem] text-base leading-8 text-ink-body">
              {t("pilot.formBody", locale)}
            </p>
            <div className="mt-7 rounded-2xl border border-sand bg-warm px-5 py-5">
              <p className="font-dm-sans text-micro font-semibold uppercase tracking-widest text-sage-dark/70">
                {t("pilot.fitEyebrow", locale)}
              </p>
              <p className="mt-2 text-sm leading-7 text-ink-body">
                {t("pilot.fitBody", locale)}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-sand bg-surface-card p-6 shadow-[0_24px_60px_rgba(26,26,46,0.06)] md:p-8">
            {status === "sent" ? (
              <div className="rounded-[22px] border border-sage/15 bg-sage-soft px-6 py-10 text-center">
                <div className="font-fraunces text-5xl leading-none text-bronze">+</div>
                <h3 className="mt-4 font-fraunces text-3xl leading-tight text-ink">
                  {t("pilot.successTitle", locale)}
                </h3>
                <p className="mt-3 text-base leading-8 text-ink-body">
                  {t("pilot.successBody", locale)}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-5">
                  <div>
                    <p className="font-fraunces text-title leading-tight text-ink">{t("pilot.formHeading", locale)}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-body">
                      {t("pilot.formSubheading", locale)}
                    </p>
                  </div>
                  <span className="rounded-full border border-bronze/15 bg-bronze/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                    {t("pilot.formSpotsLabel", locale)}
                  </span>
                </div>

                <form onSubmit={handleSubmit} onFocus={handleFormStart} className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField label={t("pilot.labelName", locale)} required>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder={t("pilot.placeholderName", locale)}
                        className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-bronze/15"
                      />
                    </FormField>

                    <FormField label={t("pilot.labelEmail", locale)} required>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder={t("pilot.placeholderEmail", locale)}
                        className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-bronze/15"
                      />
                    </FormField>
                  </div>

                  <FormField label={t("pilot.labelCompany", locale)} required>
                    <input
                      required
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder={t("pilot.placeholderCompany", locale)}
                      className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    />
                  </FormField>

                  <FormField label={t("pilot.labelSize", locale)}>
                    <select
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink transition-all focus:border-bronze/45 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    >
                      <option value="">{t("pilot.sizeOption0", locale)}</option>
                      <option value="5-10">{t("pilot.sizeOption1", locale)}</option>
                      <option value="11-25">{t("pilot.sizeOption2", locale)}</option>
                      <option value="26-50">{t("pilot.sizeOption3", locale)}</option>
                      <option value="51-80">{t("pilot.sizeOption4", locale)}</option>
                      <option value="80+">{t("pilot.sizeOption5", locale)}</option>
                    </select>
                  </FormField>

                  <FormField label={t("pilot.labelQuestion", locale)}>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      placeholder={t("pilot.placeholderQuestion", locale)}
                      className="w-full resize-none rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    />
                  </FormField>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-bronze px-8 py-3.5 text-base font-semibold text-[var(--color-text-on-accent)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
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
                    <p className="rounded-xl border border-state-error-border bg-state-error-soft px-4 py-3 text-sm text-state-error-fg">
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

function EditorialSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id}>
      <PageWidthDivider />
      <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <p className="font-dm-sans text-label uppercase text-[var(--color-accent-primary-strong)]">
            {eyebrow}
          </p>
        </div>
        <div>
          <h2 className="max-w-[13ch] font-fraunces text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.02] tracking-tight text-ink">
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
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-[var(--color-accent-primary-strong)]">*</span>}
      </span>
      {children}
    </label>
  );
}

function FeatureCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-[24px] border border-sand bg-surface-card p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-dm-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {number}
        </span>
        <div className="h-px flex-1 bg-sand" />
      </div>
      <h3 className="font-fraunces text-title leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-base leading-8 text-ink-body">{desc}</p>
    </article>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <article className="grid gap-5 rounded-[24px] border border-sand bg-surface-card p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)] md:grid-cols-[88px_minmax(0,1fr)] md:items-start">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bronze/10 font-fraunces text-2xl text-bronze">
        {step}
      </div>
      <div>
        <h3 className="font-fraunces text-title leading-tight text-ink">{title}</h3>
        <p className="mt-3 max-w-[56rem] text-base leading-8 text-ink-body">{desc}</p>
      </div>
    </article>
  );
}

function CommitmentCard({ title, desc, commitmentLabel }: { title: string; desc: string; commitmentLabel: string }) {
  return (
    <article className="rounded-[24px] border border-sand bg-warm px-6 py-6">
      <p className="font-dm-sans text-micro font-semibold uppercase tracking-widest text-sage-dark/70">
        {commitmentLabel}
      </p>
      <h3 className="mt-2 font-fraunces text-title leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-base leading-8 text-ink-body">{desc}</p>
    </article>
  );
}
