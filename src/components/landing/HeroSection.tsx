"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Self dark panel ─────────────────────────────────────────────────────────

function SelfPanel() {
  const { locale } = useLocale();

  const dims = [
    { name: t("landing.selfDim1", locale), val: 79, tier: "high" as const },
    { name: t("landing.selfDim2", locale), val: 46, tier: "moderate" as const },
    { name: t("landing.selfDim3", locale), val: 34, tier: "low" as const },
  ];

  const tierStyle = {
    high:     { text: "text-[#3d6b5e]", bg: "bg-[#e8f2f0]", tagText: "text-[#1e3d34]" },
    moderate: { text: "text-[#c17f4a]", bg: "bg-[#fdf5ee]", tagText: "text-[#8a5530]" },
    low:      { text: "text-[#8a8a9a]", bg: "bg-[#f2ede6]", tagText: "text-[#8a8a9a]" },
  };

  const tierLabel = {
    high: t("landing.selfTagHigh", locale),
    moderate: t("landing.selfTagMod", locale),
    low: t("landing.selfTagLow", locale),
  };

  return (
    <div className="overflow-hidden rounded-2xl shadow-lg shadow-black/[0.08] md:flex md:h-full md:flex-col">
      {/* ═══ SÖTÉT HERO FEJLÉC ═══ */}
      <div className="relative bg-gradient-to-br from-[#2a5244] via-[#1e3d34] to-[#1a2e28] px-6 pb-5 pt-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/[0.015]" />
        <p className="text-[8px] uppercase tracking-[1.5px] text-white/20">
          {t("landing.selfPanelEyebrow", locale)}
        </p>
        <p className="mt-1 font-fraunces text-[14px] text-white/[0.35]">
          {t("landing.selfPanelName", locale)}
        </p>
        <div className="mt-0.5 flex items-center gap-2.5">
          <p className="font-fraunces text-xl font-medium italic text-[#e8a96a]">
            {t("landing.selfPanelType", locale)}
          </p>
          <span className="rounded-md bg-white/[0.08] px-2 py-0.5 text-[8px] font-medium text-white/[0.35]">
            Top 25%
          </span>
        </div>
        <p className="mt-1.5 max-w-[340px] text-[10px] leading-[1.45] text-white/[0.22]">
          {t("landing.selfPanelInsight", locale)}
        </p>
      </div>

      {/* ═══ FEHÉR BODY ═══ */}
      <div className="bg-white px-5 pb-0 pt-4 md:flex md:flex-1 md:flex-col md:justify-between">
        {/* 3 dimenzió */}
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {dims.map((d) => {
            const c = tierStyle[d.tier];
            return (
              <div key={d.name} className="rounded-lg bg-[#f2ede6] px-1.5 py-2.5 text-center">
                <p className="text-[9px] font-medium text-[#8a8a9a]">{d.name}</p>
                <p className={`font-fraunces text-2xl leading-none ${c.text}`}>{d.val}</p>
                <span className={`mt-1 inline-block rounded-sm px-1.5 py-0.5 text-[7px] font-semibold ${c.bg} ${c.tagText}${d.tier === "low" ? " border border-[#e8e0d3]/60" : ""}`}>
                  {tierLabel[d.tier]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Erősségeid / Figyelendő */}
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-[#3d6b5e]/10 bg-[#e8f2f0] px-3 py-2.5">
            <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-[#1e3d34]/60">
              {t("landing.selfStrLabel", locale)}
            </p>
            <p className="text-[9px] leading-[1.4] text-[#4a4a5e]">
              <span className="text-[#3d6b5e]">• </span>
              <span className="font-medium text-[#1e3d34]">{t("landing.selfStr1Dim", locale)}</span>
              {" "}{t("landing.selfStr1Desc", locale)}
            </p>
            <p className="mt-0.5 text-[9px] leading-[1.4] text-[#4a4a5e]">
              <span className="text-[#3d6b5e]">• </span>
              <span className="font-medium text-[#1e3d34]">{t("landing.selfStr2Dim", locale)}</span>
              {" "}{t("landing.selfStr2Desc", locale)}
            </p>
          </div>
          <div className="rounded-lg border border-[#c17f4a]/10 bg-[#fdf5ee] px-3 py-2.5">
            <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-[#8a5530]/60">
              {t("landing.selfWatchLabel", locale)}
            </p>
            <p className="text-[9px] leading-[1.4] text-[#4a4a5e]">
              <span className="text-[#c17f4a]">• </span>
              <span className="font-medium text-[#8a5530]">{t("landing.selfWatch1Dim", locale)}</span>
            </p>
            <p className="mt-0.5 pl-2.5 text-[9px] leading-[1.4] text-[#4a4a5e]">
              {t("landing.selfWatch1Desc", locale)}
            </p>
          </div>
        </div>

        {/* Belbin teaser */}
        <div className="flex gap-1.5">
          <div className="flex-[1.2] rounded-lg border border-[#3d6b5e]/30 bg-[#e8f2f0] px-2.5 py-2">
            <span className="inline-flex rounded-sm bg-[#3d6b5e] px-1.5 py-0.5 text-[6px] font-semibold uppercase tracking-wide text-white">
              {t("landing.selfBelbinPrimary", locale)}
            </span>
            <p className="mt-0.5 text-[11px] font-semibold text-[#1a1a2e]">{t("landing.selfBelbin1Name", locale)}</p>
            <p className="text-[8px] text-[#4a4a5e]">{t("landing.selfBelbin1Desc", locale)}</p>
          </div>
          <div className="flex-1 rounded-lg border border-[#e8e0d3] px-2.5 py-2">
            <span className="inline-flex rounded-sm bg-[#fdf5ee] px-1.5 py-0.5 text-[6px] font-semibold uppercase tracking-wide text-[#8a5530]">
              {t("landing.selfBelbinSecondary", locale)}
            </span>
            <p className="mt-0.5 text-[11px] font-semibold text-[#1a1a2e]">{t("landing.selfBelbin2Name", locale)}</p>
            <p className="text-[8px] text-[#4a4a5e]">{t("landing.selfBelbin2Desc", locale)}</p>
          </div>
          <div className="flex-1 rounded-lg border border-[#e8e0d3] px-2.5 py-2">
            <span className="inline-flex rounded-sm bg-[#f2ede6] px-1.5 py-0.5 text-[6px] font-semibold uppercase tracking-wide text-[#8a8a9a]">
              {t("landing.selfBelbinTertiary", locale)}
            </span>
            <p className="mt-0.5 text-[11px] font-semibold text-[#1a1a2e]">{t("landing.selfBelbin3Name", locale)}</p>
            <p className="text-[8px] text-[#4a4a5e]">{t("landing.selfBelbin3Desc", locale)}</p>
          </div>
        </div>
      </div>

      {/* ═══ FADE-OUT CTA ═══ */}
      <div className="flex h-10 items-center justify-center rounded-b-2xl bg-gradient-to-b from-white to-[#f2ede6]">
        <span className="text-[11px] font-medium text-[#3d6b5e]">
          {t("landing.selfFadeCta", locale)}
        </span>
      </div>
    </div>
  );
}

// ─── Team dark panel ─────────────────────────────────────────────────────────

function TeamPanel() {
  const { locale } = useLocale();

  const members = [
    {
      initials: "KA",
      name: "Kovács Anna",
      role: "Sales Lead",
      avatarBg: "#3d6b5e",
      badge: t("landing.teamMember1Badge", locale),
      badgeBg: "rgba(61,107,94,0.25)",
      badgeColor: "#7aaa9a",
      bars: [true, true, true, true, false],
    },
    {
      initials: "NP",
      name: "Nagy Péter",
      role: "Account Exec",
      avatarBg: "#8a5530",
      badge: t("landing.teamMember2Badge", locale),
      badgeBg: "rgba(193,127,74,0.2)",
      badgeColor: "#e8a96a",
      bars: [true, true, false, true, false],
    },
    {
      initials: "SZ",
      name: "Szabó Zsófia",
      role: "BDR",
      avatarBg: "#4a4a5e",
      badge: t("landing.teamMember3Badge", locale),
      badgeBg: "rgba(255,255,255,0.07)",
      badgeColor: "rgba(255,255,255,0.4)",
      bars: [true, false, true, false, true],
    },
  ];

  return (
    <>
      {/* Member list card */}
      <div className="overflow-hidden rounded-[14px] border border-white/7 bg-white/4">
        <div className="flex items-center justify-between border-b border-white/6 p-3 px-4">
          <span className="font-dm-sans text-[10px] uppercase tracking-wide text-white/30">
            {t("landing.teamPanelHeader", locale)}
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
              <div className="min-w-0 flex-1">
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
                          ? i % 2 === 0 ? "#5a8f7f" : "#c17f4a"
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
          {t("landing.teamInsightLabel", locale)}
        </p>
        <p className="text-[13px] leading-relaxed text-white/55">
          {t("landing.teamInsightDesc", locale)}
        </p>
        <span
          className="mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: "rgba(193,127,74,0.15)", color: "#e8a96a" }}
        >
          {t("landing.teamInsightBadge", locale)}
        </span>
      </div>

      {/* Founding kártya */}
      <div
        className="flex items-center justify-between gap-3 rounded-xl p-3.5"
        style={{ background: "rgba(193,127,74,0.08)", border: "1px solid rgba(193,127,74,0.18)" }}
      >
        <div>
          <p className="font-dm-sans text-[10px] uppercase tracking-wide" style={{ color: "#c17f4a" }}>
            {t("landing.teamFoundingLabel", locale)}
          </p>
          <p className="text-[13px] font-semibold text-white/75">{t("landing.teamFoundingTitle", locale)}</p>
          <p className="text-[11px] text-white/35">{t("landing.teamFoundingDesc", locale)}</p>
        </div>
        <span
          className="animate-pulse shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold text-white"
          style={{ background: "#c17f4a" }}
        >
          {t("landing.teamFoundingCta", locale)}
        </span>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HeroSection({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const isSelf = mode === "self";
  const accentColor = isSelf ? "#c17f4a" : "#3d6b5e";

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1120px] px-7 pb-6 pt-12">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-10">

          {/* 1. Eyebrow + Headline */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="order-1 flex flex-col"
          >
            <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
              <div className="h-[1.5px] w-5 shrink-0" style={{ background: accentColor }} />
              <span
                className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                {isSelf ? t("landing.selfEyebrow", locale) : t("landing.teamEyebrow", locale)}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-fraunces font-normal tracking-tight text-ink"
              style={{ fontSize: "clamp(2.75rem, 8vw, 3.75rem)", lineHeight: 1.06 }}
            >
              {isSelf ? t("landing.selfHeadlineBefore", locale) : t("landing.teamHeadlineBefore", locale)}
              <em className="not-italic italic" style={{ color: accentColor }}>
                {isSelf ? t("landing.selfHeadlineEm", locale) : t("landing.teamHeadlineEm", locale)}
              </em>
            </motion.h1>
          </motion.div>

          {/* 2. Preview panel */}
          {isSelf ? (
            <div className="order-2 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-8 md:self-stretch">
              <div className="mx-auto w-full max-w-[460px] md:flex md:h-full md:flex-col">
                <SelfPanel />
              </div>
            </div>
          ) : (
            <div
              className="order-2 flex flex-col gap-4 overflow-hidden rounded-[20px] p-6 md:col-start-2 md:row-span-2 md:row-start-1 md:p-7 lg:p-9"
              style={{ background: "#1a1a2e", minHeight: 420 }}
            >
              <TeamPanel />
            </div>
          )}

          {/* 3. Sub + CTA + Microcopy */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="order-3 flex flex-col md:col-start-1 md:row-start-2"
          >
            <motion.p
              variants={fadeUp}
              className="mb-7 text-[16px] font-light leading-relaxed text-ink-body"
            >
              {isSelf ? t("landing.selfSub", locale) : t("landing.teamSub", locale)}
            </motion.p>

            <motion.div variants={fadeUp} className="mb-4">
              <Link
                href={isSelf ? "/sign-up" : "/sign-up?type=team"}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-md transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:brightness-[1.06] sm:w-auto"
                style={{
                  background: accentColor,
                  boxShadow: `0 4px 14px ${isSelf ? "rgba(193,127,74,0.25)" : "rgba(61,107,94,0.25)"}`,
                }}
              >
                {isSelf ? t("landing.selfCta", locale) : t("landing.teamCta", locale)}
              </Link>
            </motion.div>

            {isSelf ? (
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
                {[
                  { icon: "⏱", text: t("landing.selfMetaTime", locale) },
                  { icon: "🔬", text: t("landing.selfMetaMethod", locale) },
                  { icon: "⚡", text: t("landing.selfMetaInstant", locale) },
                  { icon: "🆓", text: t("landing.selfMetaFree", locale) },
                ].map((m) => (
                  <span key={m.text} className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e0d3] bg-white/60 px-3 py-1.5 text-[11px] text-[#4a4a5e]">
                    <span className="text-[10px]">{m.icon}</span>
                    {m.text}
                  </span>
                ))}
              </motion.div>
            ) : (
              <motion.p variants={fadeUp} className="text-center text-[13px] text-[#8a8a9a] sm:text-left">
                {t("landing.teamMicrocopy", locale)}
              </motion.p>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
