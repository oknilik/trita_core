"use client";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Features({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const accentColor = mode === "self" ? "#c17f4a" : "#3d6b5e";

  const features = mode === "self"
    ? [
        { badge: t("landing.selfFeat1Badge", locale), title: t("landing.selfFeat1Title", locale), desc: t("landing.selfFeat1Desc", locale), featured: true },
        { badge: t("landing.selfFeat2Badge", locale), title: t("landing.selfFeat2Title", locale), desc: t("landing.selfFeat2Desc", locale), featured: false },
        { badge: t("landing.selfFeat3Badge", locale), title: t("landing.selfFeat3Title", locale), desc: t("landing.selfFeat3Desc", locale), featured: false },
      ]
    : [
        { badge: t("landing.teamFeat1Badge", locale), title: t("landing.teamFeat1Title", locale), desc: t("landing.teamFeat1Desc", locale), featured: true },
        { badge: t("landing.teamFeat2Badge", locale), title: t("landing.teamFeat2Title", locale), desc: t("landing.teamFeat2Desc", locale), featured: false },
        { badge: t("landing.teamFeat3Badge", locale), title: t("landing.teamFeat3Title", locale), desc: t("landing.teamFeat3Desc", locale), featured: false },
      ];

  return (
    <section className="px-7 py-20">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-16 text-center">
          <h2 className="font-fraunces text-[clamp(28px,3.5vw,42px)] font-normal leading-[1.1] tracking-tight text-ink">
            {t("landing.featuresTitleBefore", locale)}
            <em className="not-italic italic text-[#5a8f7f]">{t("landing.featuresTitleEm", locale)}</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              transition={{ delay: i * 0.08 } as Parameters<typeof motion.div>[0]["transition"]}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={[
                "flex flex-col rounded-2xl border border-[#e8e0d3] p-7 shadow-sm transition-shadow hover:shadow-[0_12px_32px_rgba(26,26,46,0.06)]",
                f.featured ? "bg-[#f2ede6]" : "bg-white",
                i === 0 ? "lg:col-span-1" : "",
              ].join(" ")}
            >
              <span
                className="mb-4 self-start rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: `${accentColor}15`, color: accentColor }}
              >
                {f.badge}
              </span>
              <h3 className="font-fraunces mb-2 text-lg text-ink">{f.title}</h3>
              <p className="flex-1 text-[13px] leading-relaxed text-ink-body">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
