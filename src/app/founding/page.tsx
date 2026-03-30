"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export default function FoundingPage() {
  const { locale } = useLocale();
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const benefitGroups = [
    [
      { number: "01", title: t("founding.benefit1Title", locale), desc: t("founding.benefit1Desc", locale) },
      { number: "02", title: t("founding.benefit2Title", locale), desc: t("founding.benefit2Desc", locale) },
      { number: "03", title: t("founding.benefit3Title", locale), desc: t("founding.benefit3Desc", locale) },
    ],
    [
      { number: "04", title: t("founding.benefit4Title", locale), desc: t("founding.benefit4Desc", locale) },
      { number: "05", title: t("founding.benefit5Title", locale), desc: t("founding.benefit5Desc", locale) },
      { number: "06", title: t("founding.benefit6Title", locale), desc: t("founding.benefit6Desc", locale) },
    ],
  ];

  const steps = [
    { step: "01", title: t("founding.step1Title", locale), desc: t("founding.step1Desc", locale) },
    { step: "02", title: t("founding.step2Title", locale), desc: t("founding.step2Desc", locale) },
    { step: "03", title: t("founding.step3Title", locale), desc: t("founding.step3Desc", locale) },
  ];

  const commitments = [
    { title: t("founding.commitment1Title", locale), desc: t("founding.commitment1Desc", locale) },
    { title: t("founding.commitment2Title", locale), desc: t("founding.commitment2Desc", locale) },
    { title: t("founding.commitment3Title", locale), desc: t("founding.commitment3Desc", locale) },
  ];

  const signals = [
    { value: t("founding.signal1Value", locale), label: t("founding.signal1Label", locale) },
    { value: t("founding.signal2Value", locale), label: t("founding.signal2Label", locale) },
    { value: t("founding.signal3Value", locale), label: t("founding.signal3Label", locale) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/founding-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="bg-cream text-ink selection:bg-bronze/20">
      <section className="border-b border-sand">
        <div className="mx-auto max-w-[1120px] px-7 pb-14 pt-12 md:pb-20 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_380px] lg:items-start">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-bronze" />
                <span className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-bronze">
                  {t("founding.eyebrow", locale)}
                </span>
              </div>

              <div className="mb-6 inline-flex items-center rounded-full border border-bronze/15 bg-bronze/8 px-4 py-1.5 text-sm font-medium text-bronze">
                {t("founding.badge", locale)}
              </div>

              <h1 className="max-w-[11ch] font-fraunces text-[clamp(3rem,8vw,5.2rem)] leading-[0.98] tracking-tight text-ink">
                {t("founding.heroTitle", locale)}<em className="not-italic text-bronze">{t("founding.heroTitleEm", locale)}</em>
              </h1>

              <p className="mt-6 max-w-[620px] text-lg leading-[1.8] text-ink-body md:text-[19px]">
                {t("founding.heroBody", locale)}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#jelentkezes"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-bronze px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bronze-dark hover:shadow-lg"
                >
                  {t("founding.heroCta", locale)}
                </a>
                <a
                  href="#mit-kapsz"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-xl border border-sand bg-white px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:border-sage/25 hover:text-sage"
                >
                  {t("founding.heroCtaSecondary", locale)}
                </a>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <MetaChip>{t("founding.metaChip1", locale)}</MetaChip>
                <MetaChip>{t("founding.metaChip2", locale)}</MetaChip>
                <MetaChip>{t("founding.metaChip3", locale)}</MetaChip>
              </div>
            </div>

            <aside className="overflow-hidden rounded-[24px] border border-sand bg-white shadow-[0_24px_60px_rgba(26,26,46,0.06)]">
              <div className="border-b border-sand bg-warm px-6 py-6">
                <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze">
                  {t("founding.asideEyebrow", locale)}
                </p>
                <p className="mt-3 font-fraunces text-[28px] leading-tight text-ink">
                  {t("founding.asideTitle", locale)}
                </p>
                <p className="mt-3 text-sm leading-7 text-ink-body">
                  {t("founding.asideBody", locale)}
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
                  <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-sage-dark/70">
                    {t("founding.aside90Eyebrow", locale)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-ink-body">
                    {t("founding.aside90Body", locale)}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <EditorialSection
        id="mit-kapsz"
        eyebrow={t("founding.benefitsEyebrow", locale)}
        title={t("founding.benefitsTitle", locale)}
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
        eyebrow={t("founding.stepsEyebrow", locale)}
        title={t("founding.stepsTitle", locale)}
      >
        <div className="grid gap-5">
          {steps.map((item) => (
            <StepCard key={item.step} {...item} />
          ))}
        </div>
      </EditorialSection>

      <EditorialSection
        eyebrow={t("founding.commitmentsEyebrow", locale)}
        title={t("founding.commitmentsTitle", locale)}
      >
        <div className="grid gap-4">
          {commitments.map((item) => (
            <CommitmentCard key={item.title} {...item} commitmentLabel={t("founding.commitmentLabel", locale)} />
          ))}
        </div>
      </EditorialSection>

      <section id="jelentkezes" className="border-t border-sand">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-14 md:py-20 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-bronze" />
              <span className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-bronze">
                {t("founding.formEyebrow", locale)}
              </span>
            </div>
            <h2 className="font-fraunces text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.02] tracking-tight text-ink">
              {t("founding.formTitle", locale)}
            </h2>
            <p className="mt-5 max-w-[28rem] text-base leading-8 text-ink-body">
              {t("founding.formBody", locale)}
            </p>
            <div className="mt-7 rounded-2xl border border-sand bg-warm px-5 py-5">
              <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-sage-dark/70">
                {t("founding.fitEyebrow", locale)}
              </p>
              <p className="mt-2 text-sm leading-7 text-ink-body">
                {t("founding.fitBody", locale)}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-sand bg-white p-6 shadow-[0_24px_60px_rgba(26,26,46,0.06)] md:p-8">
            {status === "sent" ? (
              <div className="rounded-[22px] border border-sage/15 bg-sage-soft px-6 py-10 text-center">
                <div className="font-fraunces text-5xl leading-none text-bronze">+</div>
                <h3 className="mt-4 font-fraunces text-3xl leading-tight text-ink">
                  {t("founding.successTitle", locale)}
                </h3>
                <p className="mt-3 text-base leading-8 text-ink-body">
                  {t("founding.successBody", locale)}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-5">
                  <div>
                    <p className="font-fraunces text-[28px] leading-tight text-ink">{t("founding.formHeading", locale)}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-body">
                      {t("founding.formSubheading", locale)}
                    </p>
                  </div>
                  <span className="rounded-full border border-bronze/15 bg-bronze/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
                    {t("founding.formSpotsLabel", locale)}
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField label={t("founding.labelName", locale)} required>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder={t("founding.placeholderName", locale)}
                        className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                      />
                    </FormField>

                    <FormField label={t("founding.labelEmail", locale)} required>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder={t("founding.placeholderEmail", locale)}
                        className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                      />
                    </FormField>
                  </div>

                  <FormField label={t("founding.labelCompany", locale)} required>
                    <input
                      required
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder={t("founding.placeholderCompany", locale)}
                      className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    />
                  </FormField>

                  <FormField label={t("founding.labelSize", locale)}>
                    <select
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      className="w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    >
                      <option value="">{t("founding.sizeOption0", locale)}</option>
                      <option value="5-10">{t("founding.sizeOption1", locale)}</option>
                      <option value="11-25">{t("founding.sizeOption2", locale)}</option>
                      <option value="26-50">{t("founding.sizeOption3", locale)}</option>
                      <option value="51-80">{t("founding.sizeOption4", locale)}</option>
                      <option value="80+">{t("founding.sizeOption5", locale)}</option>
                    </select>
                  </FormField>

                  <FormField label={t("founding.labelQuestion", locale)}>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      placeholder={t("founding.placeholderQuestion", locale)}
                      className="w-full resize-none rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-bronze/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bronze/15"
                    />
                  </FormField>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-bronze px-8 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bronze-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "sending" ? t("founding.submitSending", locale) : t("founding.submitDefault", locale)}
                    </button>
                    <p className="text-sm leading-6 text-ink-body">
                      {t("founding.preferEmail", locale)}{" "}
                      <a href="mailto:hello@trita.io" className="font-medium text-sage transition-colors hover:text-sage-dark">
                        hello@trita.io
                      </a>
                    </p>
                  </div>

                  {status === "error" && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {t("founding.errorMessage", locale)}
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
    <section id={id} className="border-t border-sand">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-14 md:py-20 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-bronze">
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
    <span className="inline-flex items-center rounded-full border border-sand bg-white px-3 py-1.5 text-sm text-ink-body">
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
        {required && <span className="ml-1 text-bronze">*</span>}
      </span>
      {children}
    </label>
  );
}

function FeatureCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-[24px] border border-sand bg-white p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-dm-sans text-xs font-semibold uppercase tracking-[0.2em] text-bronze/70">
          {number}
        </span>
        <div className="h-px flex-1 bg-sand" />
      </div>
      <h3 className="font-fraunces text-[27px] leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-base leading-8 text-ink-body">{desc}</p>
    </article>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <article className="grid gap-5 rounded-[24px] border border-sand bg-white p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)] md:grid-cols-[88px_minmax(0,1fr)] md:items-start">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bronze/10 font-fraunces text-2xl text-bronze">
        {step}
      </div>
      <div>
        <h3 className="font-fraunces text-[30px] leading-tight text-ink">{title}</h3>
        <p className="mt-3 max-w-[56rem] text-base leading-8 text-ink-body">{desc}</p>
      </div>
    </article>
  );
}

function CommitmentCard({ title, desc, commitmentLabel }: { title: string; desc: string; commitmentLabel: string }) {
  return (
    <article className="rounded-[24px] border border-sand bg-warm px-6 py-6">
      <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-sage-dark/70">
        {commitmentLabel}
      </p>
      <h3 className="mt-2 font-fraunces text-[28px] leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-base leading-8 text-ink-body">{desc}</p>
    </article>
  );
}
