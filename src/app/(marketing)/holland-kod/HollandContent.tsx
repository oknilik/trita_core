"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { RIASEC_CONTENT } from "@/lib/riasec-content";

// Holland-kód (RIASEC) értelmező — publikus magyarázó oldal a karrier-
// iránytű kódjaihoz. A marketing-oldalak vizuális idiómáját követi
// (eyebrow + fraunces headline + kártya-rács), tartalma a riasec-content
// közös moduljából jön.

export function HollandContent() {
  const { locale } = useLocale();
  const isHu = locale === "hu";

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      {/* Hero */}
      <section className="px-7 pb-8 pt-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-[1.5px] w-5 shrink-0 bg-[var(--color-accent-primary)]" />
            <span className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
              {isHu ? "Karrier-iránytű" : "Career compass"}
            </span>
          </div>
          <h1 className="mb-4 font-fraunces text-fluid-title font-medium tracking-tight text-ink">
            {isHu ? "Mi az a Holland-kód?" : "What is a Holland code?"}
          </h1>
          <p className="max-w-[640px] text-[16px] font-light leading-relaxed text-ink-body">
            {isHu
              ? "A Holland-kód (RIASEC) a pályaválasztás egyik legtöbbet kutatott modellje: hat érdeklődés-típus, amelyből a rád legjellemzőbb kettő-három adja a kódodat. Nem azt mondja meg, mihez értesz — azt jelzi, milyen munka tölt fel."
              : "The Holland code (RIASEC) is one of the most researched models in career guidance: six interest types, and the two or three most typical of you form your code. It doesn't say what you're good at — it signals what kind of work energizes you."}
          </p>
        </div>
      </section>

      {/* A hat betű */}
      <section className="px-7 pb-10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          {RIASEC_CONTENT.map((entry) => (
            <div
              key={entry.letter}
              className="rounded-2xl border border-sand bg-surface-card p-6"
              style={{ borderTopWidth: 3, borderTopColor: entry.color }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-fraunces text-lg font-semibold text-white"
                  style={{ backgroundColor: entry.color }}
                >
                  {entry.letter}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {entry.emoji} {isHu ? entry.name.hu : entry.name.en}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {isHu ? entry.tagline.hu : entry.tagline.en}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-body">
                {isHu ? entry.description.hu : entry.description.en}
              </p>
              <p className="mt-3 text-micro font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isHu ? "Jellemző tevékenységek" : "Typical activities"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(isHu ? entry.activities.hu : entry.activities.en).map((activity) => (
                  <span
                    key={activity}
                    className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-0.5 text-micro text-[var(--color-text-secondary)]"
                  >
                    {activity}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-micro font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isHu ? "Példa-szerepek" : "Example roles"}
              </p>
              <p className="mt-1 text-[12px] text-ink-body">
                {(isHu ? entry.exampleRoles.hu : entry.exampleRoles.en).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Hogyan olvasd a kódot */}
      <section className="px-7 pb-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-sand bg-surface-card p-6 md:p-8">
          <h2 className="font-fraunces text-xl text-ink">
            {isHu ? "Hogyan olvasd a kódodat?" : "How to read your code"}
          </h2>
          <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-ink-body">
            {isHu
              ? "A kódod a két legerősebb betűd, sorrendben — az „IA” például elemző-alkotó: olyan munkában vagy elemedben, ahol megérteni ÉS létrehozni is lehet. A betűk nem skatulyák: a legtöbb embernél 2-3 típus keveredik, és a sorrend számít."
              : "Your code is your two strongest letters, in order — 'IA', for example, means thinker-creator: you thrive in work where you can both understand AND create. The letters aren't boxes: most people blend 2-3 types, and the order matters."}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {(isHu
              ? [
                  ["IR", "Elemző-megvalósító", "megérteni és megépíteni — pl. fejlesztő, mérnök"],
                  ["SA", "Segítő-alkotó", "embereket fejleszteni kreatívan — pl. tanár, tréner"],
                  ["EC", "Meggyőző-rendszerező", "célt hajtani rendezetten — pl. üzletvezetés, pénzügy"],
                ]
              : [
                  ["IR", "Thinker-doer", "understand and build — e.g. developer, engineer"],
                  ["SA", "Helper-creator", "grow people creatively — e.g. teacher, trainer"],
                  ["EC", "Persuader-organizer", "chase goals in order — e.g. store management, finance"],
                ]
            ).map(([code, name, desc]) => (
              <div key={code} className="rounded-xl bg-[var(--color-surface-subtle)] p-4">
                <p className="font-mono text-sm font-semibold text-ink">{code}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink">{name}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-muted)]">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-micro leading-relaxed text-[var(--color-text-muted)]">
            {isHu
              ? "Forrás: John Holland RIASEC-modellje (Holland, 1997); a mérőeszköz-minta a US Department of Labor közkincs O*NET Interest Profiler eszközcsaládja. A Tritában a kódod forrása mindig jelölt: mért kérdőív, választott érdeklődés-címkék vagy személyiség-alapú becslés."
              : "Source: John Holland's RIASEC model (Holland, 1997); instrument pattern from the US Department of Labor's public domain O*NET Interest Profiler family. In Trita, the source of your code is always labeled: measured inventory, chosen interest tags, or a personality-based estimate."}
          </p>
        </div>
      </section>

      {/* CTA — őszinte út: az ELSŐDLEGES cél a ma is élő érték (/try vendég-
          teszt azonnali eredmény-ízelítővel); a Karrier-iránytű érdeklődés-
          mérése másodlagos link marad, hogy a kereslet-adat tovább gyűljön.
          A korábbi egyetlen CTA a fake door-ba futott ("a funkció még nem
          létezik") — indexelt SEO-oldalról ez zsákutca volt. */}
      <section className="px-7 pb-16">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--color-layer-self-hero-mid)] p-6 md:p-8">
          <div>
            <p className="font-fraunces text-lg text-white">
              {isHu ? "Kíváncsi vagy, hogyan működsz?" : "Curious how you operate?"}
            </p>
            <p className="mt-1 text-[13px] text-white/80">
              {isHu
                ? "A személyiségprofilod ingyen, ~9 perc alatt elkészül — azonnali eredménnyel. A Karrier-iránytű (benne a Holland-kód méréssel) fejlesztés alatt áll: az érdeklődésed jelzésével a sorrendjét is alakítod."
                : "Your personality profile is free and takes ~9 minutes — with an instant result. The Career Compass (including Holland-code measurement) is in development: signalling interest shapes its priority."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/try"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-[var(--color-accent-primary)] px-6 text-sm font-semibold text-[var(--color-text-on-accent)] transition hover:brightness-110"
            >
              {isHu ? "Ingyenes teszt indítása →" : "Start the free test →"}
            </Link>
            <Link
              href="/career"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-white/30 px-5 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              {isHu ? "Karrier-iránytű: érdekel" : "Career Compass: I'm interested"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
