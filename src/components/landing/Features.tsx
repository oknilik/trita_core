"use client";

import { motion } from "framer-motion";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

type Feature = {
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  tag: string;
  tagBg: string;
  tagColor: string;
};

const selfFeatures: Feature[] = [
  {
    icon: "📊",
    iconBg: "#fdf5ee",
    title: "Személyiségprofil",
    desc: "Részletes HEXACO eredmény, 6 dimenzió mentén — erősségek, vakfoltok, és amit mások nem mondanak el.",
    tag: "🆓 Ingyenes",
    tagBg: "#e8f2f0",
    tagColor: "#1e3d34",
  },
  {
    icon: "🧭",
    iconBg: "#fdf5ee",
    title: "Karriertérkép",
    desc: "Konkrét karrierirányok, szerepek és iparágak, amelyek a profilodhoz illeszkednek — nem általánosságok.",
    tag: "✦ Pro · 7€",
    tagBg: "#fdf5ee",
    tagColor: "#8a5530",
  },
  {
    icon: "📈",
    iconBg: "rgba(26,26,46,0.06)",
    title: "Fejlődési terv",
    desc: "ABA-alapú viselkedéselemzéssel összeállított fejlesztési javaslatok — kis lépések, nagy változás.",
    tag: "✦ Pro · 7€",
    tagBg: "#fdf5ee",
    tagColor: "#8a5530",
  },
];

const teamFeatures: Feature[] = [
  {
    icon: "👥",
    iconBg: "#e8f2f0",
    title: "Csapatdinamika",
    desc: "Vizuális térkép: ki kivel dolgozik jól, hol vannak természetes szövetségesek és potenciális ütközések.",
    tag: "Csapat csomagban",
    tagBg: "#e8f2f0",
    tagColor: "#1e3d34",
  },
  {
    icon: "⚠️",
    iconBg: "#e8f2f0",
    title: "Konfliktus-érzékelés",
    desc: "Observer feedback + önkép összevetés: mielőtt a feszültségből valódi konfliktus lesz.",
    tag: "Csapat csomagban",
    tagBg: "#e8f2f0",
    tagColor: "#1e3d34",
  },
  {
    icon: "📋",
    iconBg: "rgba(26,26,46,0.06)",
    title: "Csapatjelentés",
    desc: "Vezetői összefoglaló: erősségek, kockázatok, és konkrét javaslatok a csapatépítéshez.",
    tag: "Csapat csomagban",
    tagBg: "#e8f2f0",
    tagColor: "#1e3d34",
  },
];

export function Features({ mode }: { mode: SiteMode }) {
  const features = mode === "self" ? selfFeatures : teamFeatures;

  return (
    <section className="py-12 px-7">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-[60px] text-center">
          <p className="mb-3 font-dm-sans text-[11px] font-semibold uppercase tracking-widest text-bronze">
            AMIT KAPSZ
          </p>
          <h2 className="font-fraunces text-[clamp(28px,3.5vw,42px)] font-normal leading-[1.1] tracking-tight text-ink">
            Nem tippek —{" "}
            <em className="not-italic italic text-sage">személyre szabott</em> irány
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08 } as Parameters<typeof motion.div>[0]["transition"]}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex flex-col rounded-2xl border border-[#e8e0d3] bg-white p-7 shadow-sm transition-shadow hover:shadow-[0_12px_32px_rgba(26,26,46,0.06)]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ background: f.iconBg }}
                >
                  {f.icon}
                </div>
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: f.tagBg, color: f.tagColor }}
                >
                  {f.tag}
                </span>
              </div>
              <h3 className="font-fraunces mb-2 text-lg text-ink">{f.title}</h3>
              <p className="flex-1 text-[13px] leading-relaxed text-ink-body">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
