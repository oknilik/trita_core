"use client";

import { motion } from "framer-motion";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const steps = {
  self: [
    {
      num: "01",
      title: "Készülj fel",
      desc: "Keress egy nyugodt helyet, ahol 12 percig megszakítás nélkül tudsz koncentrálni a kérdésekre.",
    },
    {
      num: "02",
      title: "Töltsd ki a tesztet",
      desc: "100 kérdés, 6 HEXACO dimenzió mentén — mindegyik a valódi személyiségedet méri, nem klisékkel dolgozik.",
    },
    {
      num: "03",
      title: "Kapd meg az eredményed",
      desc: "Részletes karriértérkép, erősségek és fejlődési irányok — azonnal, a kitöltés után.",
    },
  ],
  team: [
    {
      num: "01",
      title: "Hívd meg a csapatot",
      desc: "Adj hozzá csapattagokat — mindenki kitölti a saját HEXACO profilját egyénileg, 12 perc alatt.",
    },
    {
      num: "02",
      title: "Elemzés 48 órán belül",
      desc: "A trita összeveti a profilokat, azonosítja a dinamikákat, feszültségeket és erősségeket.",
    },
    {
      num: "03",
      title: "Csapat insight-ok",
      desc: "Személyre szabott csapatjelentés: ki kivel dolgozik jól, hol van konfliktusveszély, mit erősítsetek.",
    },
  ],
};

export function HowItWorks({ mode }: { mode: SiteMode }) {
  const isSelf = mode === "self";
  const items = steps[mode];

  return (
    <section className="px-7 pb-12 pt-6">
      <div className="mx-auto max-w-[1120px]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-[60px] text-center"
        >
          <motion.p
            variants={fadeUpVariants}
            className="mb-3 font-dm-sans text-[11px] font-semibold uppercase tracking-widest text-bronze"
          >
            HOGYAN MŰKÖDIK
          </motion.p>
          <motion.h2
            variants={fadeUpVariants}
            className="font-fraunces text-[clamp(28px,3.5vw,42px)] font-normal leading-[1.1] tracking-tight text-ink"
          >
            {isSelf ? (
              <>Három lépésben a <em className="not-italic italic text-sage">karrierprofilodhoz</em></>
            ) : (
              <>Három lépésben a <em className="not-italic italic text-sage">csapatképhez</em></>
            )}
          </motion.h2>
        </motion.div>

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="absolute left-[15%] right-[15%] top-[44px] hidden h-[1.5px] bg-[#e8e0d3] sm:block" />

          {items.map((step, i) => (
            <motion.div
              key={step.num}
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 } as Parameters<typeof motion.div>[0]["transition"]}
              className="flex flex-col items-center text-center"
            >
              <div
                className={[
                  "font-fraunces mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-medium",
                  isSelf
                    ? "border border-[#c17f4a]/20 bg-[#fdf5ee] text-[#c17f4a]"
                    : "border border-[#3d6b5e]/20 bg-[#e8f2f0] text-[#3d6b5e]",
                ].join(" ")}
              >
                {step.num}
              </div>
              <h3 className="font-fraunces mb-2.5 text-xl text-ink">{step.title}</h3>
              <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-ink-body">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
