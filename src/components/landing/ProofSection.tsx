"use client";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { Reveal } from "@/components/landing/Reveal";
import type { SiteMode } from "@/components/landing/ModeSwitcher";
import {
  FlaskIcon,
  CompassIcon,
  ChatIcon,
  NodesIcon,
  EyeIcon,
  SearchIcon,
} from "@/components/landing/icons";

export function ProofSection({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const isSelf = mode === "self";
  const accentColor = isSelf ? "var(--color-accent-primary)" : "var(--color-action-primary-bg)";

  const cards = isSelf
    ? [
        { Icon: FlaskIcon, title: t("landing.proof1Title", locale), desc: t("landing.proof1Desc", locale) },
        { Icon: CompassIcon, title: t("landing.proof2Title", locale), desc: t("landing.proof2Desc", locale) },
        { Icon: ChatIcon, title: t("landing.proof3Title", locale), desc: t("landing.proof3Desc", locale) },
      ]
    : [
        { Icon: NodesIcon, title: t("landing.proofTeam1Title", locale), desc: t("landing.proofTeam1Desc", locale) },
        { Icon: EyeIcon, title: t("landing.proofTeam2Title", locale), desc: t("landing.proofTeam2Desc", locale) },
        { Icon: SearchIcon, title: t("landing.proofTeam3Title", locale), desc: t("landing.proofTeam3Desc", locale) },
      ];

  return (
    <section className="px-7 py-16 md:py-24">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="font-fraunces text-fluid-title font-medium tracking-tight text-ink">
            {isSelf ? t("landing.proofTitleBefore", locale) : t("landing.proofTeamTitleBefore", locale)}
            <em className="italic" style={{ color: accentColor }}>
              {isSelf ? t("landing.proofTitleEm", locale) : t("landing.proofTeamTitleEm", locale)}
            </em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {cards.map((card, i) => (
            <Reveal
              key={card.title}
              delay={i * 0.1}
              className="rounded-2xl border border-[var(--color-border-default)] bg-surface-card p-7 text-center"
            >
              <div className="mb-4 flex justify-center" style={{ color: accentColor }}>
                <card.Icon className="h-8 w-8" />
              </div>
              <h3 className="font-fraunces mb-2 text-lg text-ink">{card.title}</h3>
              <p className="text-caption leading-relaxed text-ink-body">{card.desc}</p>
            </Reveal>
          ))}
        </div>

        {/* Testimonial — csak self módban; team módban nincs valós csapat-idézet */}
        {isSelf && (
          <div className="relative mx-auto mt-10 max-w-[560px] rounded-2xl bg-[var(--color-surface-subtle)] p-8">
            <span className="font-fraunces absolute left-6 top-4 text-5xl leading-none text-[var(--color-border-default)]">&ldquo;</span>
            <p className="font-fraunces relative text-base italic leading-relaxed text-ink-body">
              {t("landing.proofTestimonial", locale)}
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {t("landing.proofTestimonialAuthor", locale)}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
