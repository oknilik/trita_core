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
    { label: t("landing.selfDimOpenness", locale), value: 85 },
    { label: t("landing.selfDimConscientiousness", locale), value: 78 },
    { label: t("landing.selfDimExtraversion", locale), value: 54 },
  ];

  return (
    <>
      {/* Fő eredmény kártya */}
      <div className="overflow-hidden rounded-[14px] border border-white/8 bg-white/5">
        {/* Header */}
        <div
          className="p-5"
          style={{ background: "linear-gradient(135deg, #2a5244, #1e3d34)" }}
        >
          <p className="mb-1.5 font-dm-sans text-[9px] uppercase tracking-widest text-white/40">
            {t("landing.selfPanelLabel", locale)}
          </p>
          <p className="font-fraunces text-[22px] text-white">{t("landing.selfPanelTitle", locale)}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">
            {t("landing.selfPanelDesc", locale)}
          </p>
        </div>

        {/* Body */}
        <div className="p-5">
          {dims.map((d) => (
            <div key={d.label} className="mb-2.5 flex items-center gap-2.5">
              <span className="w-[110px] shrink-0 text-[12px] text-white/50">{d.label}</span>
              <div
                className="flex-1 overflow-hidden rounded-sm"
                style={{ height: 5, background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${d.value}%`,
                    background: d.value >= 70 ? "#5a8f7f" : "rgba(255,255,255,0.15)",
                  }}
                />
              </div>
              <span className="w-6 text-right text-[11px] font-semibold text-white/50">
                {d.value}
              </span>
            </div>
          ))}

          {/* Szerepcímkék */}
          <div className="mt-4 flex gap-2">
            {["Stratégia", "Product"].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-xs"
                style={{ background: "rgba(61,107,94,0.2)", color: "#7aaa9a" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mini insight kártya */}
      <div
        className="rounded-[10px] p-3 px-4"
        style={{
          background: "rgba(193,127,74,0.1)",
          border: "1px solid rgba(193,127,74,0.2)",
        }}
      >
        <p className="mb-1 font-dm-sans text-[8px] uppercase tracking-wide text-[#c17f4a]">
          {t("landing.selfWatchLabel", locale)}
        </p>
        <p className="text-[13px] leading-relaxed text-white/55">
          {t("landing.selfWatchDesc", locale)}
        </p>
      </div>
    </>
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

          {/* 2. Dark panel */}
          <div
            className="order-2 flex flex-col gap-4 overflow-hidden rounded-[20px] p-6 md:col-start-2 md:row-span-2 md:row-start-1 md:p-7 lg:p-9"
            style={{ background: "#1a1a2e", minHeight: 420 }}
          >
            {isSelf ? <SelfPanel /> : <TeamPanel />}
          </div>

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

            <motion.div variants={fadeUp} className="mb-3">
              <Link
                href={isSelf ? "/sign-up" : "/sign-up?type=team"}
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl px-[28px] py-[14px] text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg sm:inline-flex sm:w-auto"
                style={{ background: accentColor }}
              >
                {isSelf ? t("landing.selfCta", locale) : t("landing.teamCta", locale)}
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} className="text-center text-[13px] text-[#8a8a9a] sm:text-left">
              {isSelf ? t("landing.selfMicrocopy", locale) : t("landing.teamMicrocopy", locale)}
            </motion.p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
