"use client";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function HowItWorks({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const strokeColor = mode === "self" ? "#c17f4a" : "#3d6b5e";

  const steps = mode === "self"
    ? [
        { num: "01", title: t("landing.howSelf1Title", locale), desc: t("landing.howSelf1Desc", locale) },
        { num: "02", title: t("landing.howSelf2Title", locale), desc: t("landing.howSelf2Desc", locale) },
        { num: "03", title: t("landing.howSelf3Title", locale), desc: t("landing.howSelf3Desc", locale) },
      ]
    : [
        { num: "01", title: t("landing.howTeam1Title", locale), desc: t("landing.howTeam1Desc", locale) },
        { num: "02", title: t("landing.howTeam2Title", locale), desc: t("landing.howTeam2Desc", locale) },
        { num: "03", title: t("landing.howTeam3Title", locale), desc: t("landing.howTeam3Desc", locale) },
      ];

  return (
    <section className="px-7 py-20">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-16 text-center">
          <h2 className="font-fraunces text-[clamp(28px,3.5vw,42px)] font-normal leading-[1.1] tracking-tight text-ink">
            {mode === "self" ? (
              <>{t("landing.howSelfTitleBefore", locale)}<em className="not-italic italic text-[#5a8f7f]">{t("landing.howSelfTitleEm", locale)}</em></>
            ) : (
              <>{t("landing.howTeamTitleBefore", locale)}<em className="not-italic italic text-[#5a8f7f]">{t("landing.howTeamTitleEm", locale)}</em></>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              transition={{ delay: i * 0.1 } as Parameters<typeof motion.div>[0]["transition"]}
              className="flex flex-col"
            >
              <div className="relative mb-4 -mx-2 self-start px-2 py-1">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full"
                >
                  <path
                    d="M4 12 C8 4, 50 2, 92 6 C97 7, 99 12, 98 30 C97 55, 99 75, 96 90 C94 97, 60 99, 30 97 C12 96, 3 95, 2 85 C0 65, 2 38, 4 18 Z"
                    fill={strokeColor}
                    opacity="0.15"
                  />
                </svg>
                <span className="relative font-fraunces text-5xl font-light leading-none text-ink/30">
                  {step.num}
                </span>
              </div>
              <h3 className="font-dm-sans mb-2 text-base font-semibold text-ink">{step.title}</h3>
              <p className="max-w-[280px] text-sm leading-relaxed text-ink-body">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
