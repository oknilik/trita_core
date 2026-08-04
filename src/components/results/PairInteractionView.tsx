"use client";

import { useState } from "react";
import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import type {
  InteractionTextLine,
  InteractionLeaderNote,
  PairSimulationView,
} from "@/lib/interaction-view";

export interface PairGlyphInfo {
  primaryCode: string;
  secondaryCode: string;
  intensity: number;
  label: string;
}

interface PairInteractionViewProps {
  self: PairGlyphInfo;
  other: PairGlyphInfo;
  otherName: string;
  sim: PairSimulationView;
}

type PairMode = "peer" | "other-leads" | "self-leads";

function LineList({ lines }: { lines: InteractionTextLine[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {lines.map((line) => (
        <li key={line.atomId} className="text-caption leading-relaxed text-ink-body">
          <span className="mb-1 flex flex-wrap gap-1.5">
            {line.dimLabels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-warm-mid px-2 py-0.5 text-micro font-medium text-ink-body"
              >
                {label}
              </span>
            ))}
          </span>
          {line.text}
        </li>
      ))}
    </ul>
  );
}

/**
 * Valódi páros mód (B1): két megosztott, valós profil dinamikája. A vizuális
 * szókincs az archetípus-szimulációéval azonos (easy/friction/discuss +
 * vezető-blokk), a forrás-jegyzet viszont a profil-profil szintet mondja ki.
 * A partner számszerű pontszámai itt sem jelennek meg — csak glyph + név +
 * a szimuláció szövege.
 */
export function PairInteractionView({
  self,
  other,
  otherName,
  sim,
}: PairInteractionViewProps) {
  const { locale } = useLocale();
  const [mode, setMode] = useState<PairMode>("peer");

  const leaderNotes: InteractionLeaderNote[] =
    mode === "other-leads"
      ? sim.leaderNotesOther
      : mode === "self-leads"
        ? sim.leaderNotesSelf
        : [];

  const modeOptions: Array<{ value: PairMode; label: string }> = [
    { value: "peer", label: t("results.interactionRelationPeer", locale) },
    { value: "other-leads", label: t("results.interactionRelationLeader", locale) },
    { value: "self-leads", label: t("results.compareRelationSelfLeads", locale) },
  ];

  return (
    <section className="rounded-[22px] border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-6">
      <p className="font-mono text-micro uppercase tracking-widest text-muted">
        {"// "}
        {t("results.comparePairTitle", locale)}
      </p>
      <p className="mt-1 text-caption text-ink-body">
        {tf("results.comparePairWith", locale, { name: otherName })}
      </p>

      {/* Páros fejléc: két glyph-kártya — mindkét oldal ugyanazzal a
          név-nyelvtannal (a saját profil-oldal szókincse). */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { info: self, heading: t("results.interactionPairYou", locale) },
          { info: other, heading: otherName },
        ].map(({ info, heading }) => (
          <div
            key={`${heading}-${info.primaryCode}-${info.secondaryCode}`}
            className="rounded-xl border border-sand bg-cream/45 p-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
              {heading}
            </p>
            <div className="mt-2">
              <TypeGlyph
                primaryCode={info.primaryCode}
                secondaryCode={info.secondaryCode}
                typeLabel={info.label}
                locale={locale === "hu" ? "hu" : "en"}
                intensity={info.intensity}
                variant="card"
                canvas={false}
              />
            </div>
            <p className="mt-2 text-caption font-semibold text-ink">{info.label}</p>
          </div>
        ))}
      </div>

      {/* Viszony-kapcsoló — a vezetői kiegészítők iránya. Hálózat nélkül
          vált: mindkét irány kiegészítői előre ki vannak számolva. */}
      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          {t("results.interactionRelationQuestion", locale)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              aria-pressed={mode === opt.value}
              className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-caption font-semibold transition-colors ${
                mode === opt.value
                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-ink"
                  : "border-sand bg-white text-ink-body hover:bg-cream"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {sim.sparse ? (
        <p className="mt-5 rounded-xl border border-sand bg-cream/60 p-4 text-caption leading-relaxed text-ink-body">
          {t("results.interactionSparse", locale)}
        </p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-sand bg-cream/45 p-4">
              <p className="mb-3 font-mono text-micro uppercase tracking-widest text-sage-dark">
                {"// "}
                {t("results.interactionEasy", locale)}
              </p>
              <LineList lines={sim.easy} />
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="mb-3 font-mono text-micro uppercase tracking-widest text-amber-700">
                {"// "}
                {t("results.interactionFriction", locale)}
              </p>
              <LineList lines={sim.friction} />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-sand bg-white p-4">
            <p className="mb-3 font-mono text-micro uppercase tracking-widest text-muted">
              {"// "}
              {t("results.interactionDiscuss", locale)}
            </p>
            <LineList lines={sim.discuss} />
          </div>
        </>
      )}

      {leaderNotes.length > 0 ? (
        <div className="mt-4 rounded-xl border border-sand bg-cream/45 p-4">
          <p className="mb-3 font-mono text-micro uppercase tracking-widest text-muted">
            {"// "}
            {t("results.interactionLeaderTitle", locale)}
          </p>
          <ul className="flex flex-col gap-2">
            {leaderNotes.map((note) => (
              <li key={note.dim} className="text-caption leading-relaxed text-ink-body">
                <span className="mr-2 rounded-full bg-warm-mid px-2 py-0.5 text-micro font-medium text-ink-body">
                  {note.dimLabel}
                </span>
                {note.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-micro leading-relaxed text-muted">
        {t("results.comparePairSourceNote", locale)}
      </p>

      <div className="mt-4">
        <Link
          href="/interaction"
          className="inline-flex min-h-[38px] items-center rounded-[10px] bg-cream px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-warm-mid"
        >
          ← {t("results.comparePairBack", locale)}
        </Link>
      </div>
    </section>
  );
}
