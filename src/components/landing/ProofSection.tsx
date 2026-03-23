"use client";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function ProofSection() {
  const { locale } = useLocale();

  const cards = [
    { icon: "🔬", title: t("landing.proof1Title", locale), desc: t("landing.proof1Desc", locale) },
    { icon: "🧭", title: t("landing.proof2Title", locale), desc: t("landing.proof2Desc", locale) },
    { icon: "💬", title: t("landing.proof3Title", locale), desc: t("landing.proof3Desc", locale) },
  ];

  return (
    <section className="px-7 py-20">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-16 text-center">
          <h2 className="font-fraunces text-[clamp(28px,3.5vw,42px)] font-normal leading-[1.1] tracking-tight text-ink">
            {t("landing.proofTitleBefore", locale)}
            <em className="not-italic italic text-[#5a8f7f]">{t("landing.proofTitleEm", locale)}</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              transition={{ delay: i * 0.1 } as Parameters<typeof motion.div>[0]["transition"]}
              className="rounded-2xl border border-[#e8e0d3] bg-white p-7 text-center"
            >
              <div className="mb-4 text-3xl">{card.icon}</div>
              <h3 className="font-fraunces mb-2 text-lg text-ink">{card.title}</h3>
              <p className="text-[13px] leading-relaxed text-ink-body">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="relative mx-auto mt-10 max-w-[560px] rounded-2xl bg-[#f2ede6] p-8">
          <span className="font-fraunces absolute left-6 top-4 text-5xl leading-none text-[#e8e0d3]">"</span>
          <p className="font-fraunces relative text-base italic leading-relaxed text-ink-body">
            {t("landing.proofTestimonial", locale)}
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-wide text-[#8a8a9a]">
            {t("landing.proofTestimonialAuthor", locale)}
          </p>
        </div>
      </div>
    </section>
  );
}
