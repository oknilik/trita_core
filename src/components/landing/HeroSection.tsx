"use client";

import Link from "next/link";
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

// ─── Left column copy ───────────────────────────────────────────────────────

const leftCopy = {
  self: {
    eyebrow: "HEXACO KARRIERPROFIL",
    headline: ["Fedezd fel, milyen karrierre ", "vagy teremtve."],
    sub: "Tudományosan validált személyiségprofil, amely konkrét karrierirányokat mutat — nem általánosságokat.",
    cta: "Ingyenes teszt indítása →",
    ctaHref: "/sign-up",
    signIn: "Van már fiókom",
    trust: ["⏱ ~12 perc", "🔬 Validált HEXACO", "🆓 Ingyenes"],
  },
  team: {
    eyebrow: "CSAPATINTELLIGENCIA",
    headline: ["Lásd tisztábban a ", "csapatod működését."],
    headlineEm: "csapatod",
    sub: "A trita megmutatja, ami eddig láthatatlan volt — a csapatod valódi dinamikáját. Mielőtt a feszültség konfliktussá válik.",
    cta: "Megnézem a csapatomat →",
    ctaHref: "/sign-up?type=team",
    signIn: "Van már fiókom",
    trust: ["✓ 18 csapat", "⚡ 48h elemzés", "🔬 Validált"],
  },
};

// ─── Self dark panel ─────────────────────────────────────────────────────────

function SelfPanel() {
  const dims = [
    { label: "Nyitottság", value: 85, fill: "#c17f4a" },
    { label: "Lelkiismeretesség", value: 78, fill: "#c17f4a" },
    { label: "Becsületesség", value: 72, fill: "#e8a96a" },
    { label: "Extravertáltság", value: 54, fill: "rgba(193,127,74,0.2)" },
  ];

  return (
    <>
      {/* Stat sor */}
      <div className="flex gap-2.5">
        {[
          { num: "100", label: "kérdés" },
          { num: "6", label: "dimenzió" },
          { num: "12", suffix: "'", label: "perc" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-1 rounded-xl p-3.5 text-center"
            style={{ background: "rgba(193,127,74,0.08)", border: "1px solid rgba(193,127,74,0.18)" }}
          >
            <div className="font-fraunces text-[28px] leading-none text-white">
              {s.num}
              {s.suffix && <span style={{ color: "#e8a96a" }}>{s.suffix}</span>}
            </div>
            <div className="mt-1 text-[10px]" style={{ color: "rgba(193,127,74,0.55)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dimenzió kártya */}
      <div
        className="rounded-[14px] p-4 px-5"
        style={{ background: "rgba(193,127,74,0.06)", border: "1px solid rgba(193,127,74,0.12)" }}
      >
        <p
          className="mb-3 font-dm-sans text-[9px] uppercase tracking-widest"
          style={{ color: "rgba(193,127,74,0.5)" }}
        >
          Példa profil — Stratégiai Innovátor
        </p>
        {dims.map((d) => (
          <div key={d.label} className="mb-2 flex items-center gap-2.5">
            <span className="w-[100px] shrink-0 text-[11px]" style={{ color: "rgba(232,169,106,0.6)" }}>
              {d.label}
            </span>
            <div
              className="flex-1 overflow-hidden rounded-sm"
              style={{ height: 5, background: "rgba(193,127,74,0.12)" }}
            >
              <div className="h-full rounded-sm" style={{ width: `${d.value}%`, background: d.fill }} />
            </div>
            <span className="w-6 text-right text-[10px] font-semibold" style={{ color: "rgba(232,169,106,0.6)" }}>
              {d.value}
            </span>
          </div>
        ))}
      </div>

      {/* Insight idézet */}
      <div
        className="rounded-[10px] p-3 px-3.5"
        style={{ background: "rgba(193,127,74,0.12)", border: "1px solid rgba(193,127,74,0.25)" }}
      >
        <p className="mb-1 font-dm-sans text-[8px] uppercase tracking-wide" style={{ color: "#c17f4a" }}>
          KARRIERINSIGHT
        </p>
        <p className="font-fraunces text-[14px] italic leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          "Stratégiai, alapítói és tanácsadói szerepkörökben kiemelkedő — ahol a nagy kép látása fontosabb, mint a napi operáció."
        </p>
      </div>
    </>
  );
}

// ─── Team dark panel ─────────────────────────────────────────────────────────

const members = [
  {
    initials: "KA",
    name: "Kovács Anna",
    role: "Sales Lead",
    avatarBg: "#3d6b5e",
    badge: "Vezető stílus",
    badgeBg: "rgba(61,107,94,0.25)",
    badgeColor: "#7aaa9a",
    bars: [true, true, true, true, false],
  },
  {
    initials: "NP",
    name: "Nagy Péter",
    role: "Account Exec",
    avatarBg: "#8a5530",
    badge: "⚠ Ütközési pont",
    badgeBg: "rgba(193,127,74,0.2)",
    badgeColor: "#e8a96a",
    bars: [true, true, false, true, false],
  },
  {
    initials: "SZ",
    name: "Szabó Zsófia",
    role: "BDR",
    avatarBg: "#4a4a5e",
    badge: "Önkép eltérés",
    badgeBg: "rgba(255,255,255,0.07)",
    badgeColor: "rgba(255,255,255,0.4)",
    bars: [true, false, true, false, true],
  },
];

function TeamPanel() {
  return (
    <>
      {/* Member list card */}
      <div className="overflow-hidden rounded-[14px] border border-white/7 bg-white/4">
        <div className="flex items-center justify-between border-b border-white/6 p-3 px-4">
          <span className="font-dm-sans text-[10px] uppercase tracking-wide text-white/30">
            Sales csapat · 6 tag · kész
          </span>
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span className="h-1.5 w-1.5 rounded-full opacity-70" style={{ background: "#c17f4a" }} />
          </div>
        </div>
        <div className="p-2.5">
          {members.map((m) => (
            <div
              key={m.initials}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 hover:bg-white/4"
            >
              <div
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: m.avatarBg }}
              >
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-white/75">
                  {m.name} · <span className="font-normal">{m.role}</span>
                </div>
                <div className="mt-1 flex gap-[3px]">
                  {m.bars.map((active, i) => (
                    <div
                      key={i}
                      className="h-[3px] w-4 rounded-sm"
                      style={{
                        background: active
                          ? i % 2 === 0
                            ? "#5a8f7f"
                            : "#c17f4a"
                          : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <span
                className="shrink-0 rounded px-2 py-0.5 text-[9px] font-semibold"
                style={{ background: m.badgeBg, color: m.badgeColor }}
              >
                {m.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight kártya */}
      <div className="rounded-xl border border-white/8 bg-white/4 p-3.5">
        <p className="mb-1.5 font-dm-sans text-[10px] uppercase tracking-widest text-white/25">
          Csapat insight
        </p>
        <p className="text-[13px] leading-relaxed text-white/55">
          Magas Lelkiismeretesség + alacsony Együttműködés: erős executer profil, de döntési
          feszültség valószínű a 2-4. személyek között.
        </p>
        <span
          className="mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: "rgba(193,127,74,0.15)", color: "#e8a96a" }}
        >
          ⚠ Konfliktusveszély döntési helyzetben
        </span>
      </div>

      {/* Founding kártya */}
      <div
        className="flex items-center justify-between gap-3 rounded-xl p-3.5"
        style={{
          background: "rgba(193,127,74,0.08)",
          border: "1px solid rgba(193,127,74,0.18)",
        }}
      >
        <div>
          <p className="font-dm-sans text-[10px] uppercase tracking-wide" style={{ color: "#c17f4a" }}>
            ◆ FOUNDING PROGRAM
          </p>
          <p className="text-[13px] font-semibold text-white/75">Csatlakozz az első 10 cég közé</p>
          <p className="text-[11px] text-white/35">Személyes onboarding + founding ár</p>
        </div>
        <span
          className="animate-pulse shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold text-white"
          style={{ background: "#c17f4a" }}
        >
          3 hely maradt
        </span>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HeroSection({ mode }: { mode: SiteMode }) {
  const c = leftCopy[mode];
  const isSelf = mode === "self";

  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-7 pb-6 pt-12 sm:grid-cols-2 sm:items-start sm:gap-10">
        {/* Left column */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUpVariants} className="mb-5 flex items-center gap-3">
            <div
              className="h-[1.5px] w-5 shrink-0"
              style={{ background: isSelf ? "#c17f4a" : "#3d6b5e" }}
            />
            <span
              className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: isSelf ? "#c17f4a" : "#3d6b5e" }}
            >
              {c.eyebrow}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUpVariants}
            className="font-fraunces mb-[18px] text-[clamp(32px,4vw,48px)] font-normal leading-[1.08] tracking-tight text-ink"
          >
            {c.headline[0]}
            <em
              className="not-italic italic"
              style={{ color: isSelf ? "#c17f4a" : "#3d6b5e" }}
            >
              {c.headline[1]}
            </em>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUpVariants}
            className="mb-7 max-w-[380px] text-[15px] font-light leading-relaxed text-ink-body"
          >
            {c.sub}
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUpVariants} className="mb-2.5">
            <Link
              href={c.ctaHref}
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-[26px] py-[13px] text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: isSelf ? "#c17f4a" : "#3d6b5e" }}
            >
              {c.cta}
            </Link>
          </motion.div>

          {/* Sign in link */}
          <motion.div variants={fadeUpVariants} className="mb-5">
            <Link href="/sign-in" className="text-[13px] text-ink-body/60 hover:text-ink-body">
              {c.signIn}
            </Link>
          </motion.div>

          {/* Trust pills */}
          <motion.div variants={fadeUpVariants} className="flex flex-wrap gap-2">
            {c.trust.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-[#e8e0d3] bg-[#f2ede6] px-2.5 py-1 text-[11px] text-ink-body/60"
              >
                {pill}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right column — dark data panel */}
        <div
          className="flex flex-col justify-center gap-4 overflow-hidden rounded-[20px] p-6 sm:p-7 lg:p-9"
          style={{ background: isSelf ? "#1c1208" : "#1a1a2e", minHeight: 480 }}
        >
          {isSelf ? <SelfPanel /> : <TeamPanel />}
        </div>
      </div>
    </section>
  );
}
