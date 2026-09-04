import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/design-tokens";
import { dimColors } from "@/lib/color-system";
import { getDimensionLabel } from "@/lib/dimension-utils";
import { t } from "@/lib/i18n";
import { TEAM_ROLES, type TeamRoleCode } from "@/lib/team-role-scoring";

/**
 * Site-szintű link-előnézet (Slack, iMessage, LinkedIn, Teams…).
 *
 * A kép a VALÓDI főoldal hero-jának mása: krém vászon, a fókuszált landing
 * szövege (`landing.focusedEyebrow` / `ctaSelfHeadline*` / `focusedHeroSub` /
 * `focusedHeroCta`) és jobbra a `SelfPanel` (components/landing/panels.tsx)
 * kicsinyített képe — ugyanabból az i18n-kulcsból és színrendszerből, hogy a
 * megosztott kártya ne szakadjon el attól, amit a kattintó ezután lát.
 *
 * Fontok: a satori nem renderel variable TTF-et, ezért az `assets/og/` alatt
 * statikus példányok élnek (fonttools instancer, opsz=72). A szójel a
 * webes `TritaWordmark`-kal azonos: Fraunces 900, −0.03em, bronz pont a
 * pont nélküli ı fölött — a korábbi 400-as példány ettől nézett ki idegennek.
 *
 * Az OG-crawlernek nincs nyelvi kontextusa; a termék HU-first, a kép magyar.
 */
export const alt = "trita – személyiség- és csapatintelligencia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOCALE = "hu" as const;

// A globals.css világos palettájának OG-oldali tükre. A `design-tokens.ts`
// csak a márka-alapszíneket exportálja; a hero-specifikus fokok (accent-mid,
// self-hero gradiens, bronze-300, border-soft, muted) innen jönnek.
const P = {
  cream: COLORS.cream,
  card: "#ffffff",
  ink: COLORS.ink,
  inkBody: COLORS.inkBody,
  muted: "#6a6a7b",
  sand: COLORS.sand,
  borderSoft: "#ddd5c8",
  surfaceSubtle: "#f2ede6",
  sage: COLORS.sage,
  bronze: COLORS.bronze,
  bronzeDark: "#9a6538",
  bronzeStrong: "#8a5530",
  bronzeMid: "#a86b3d",
  bronzeSoft: "#e8a96a",
  selfHeroFrom: "#2a5244",
  selfHeroMid: "#1e3d34",
  selfHeroTo: "#1a2e28",
} as const;

const FRAUNCES = "Fraunces";
const DM_SANS = "DM Sans";

// ─── Szójel ────────────────────────────────────────────────────────────────

function Wordmark({ fontSize }: { fontSize: number }) {
  const dot = Math.round(fontSize * 0.22);
  return (
    <div
      aria-label="trita"
      style={{
        display: "flex",
        alignItems: "baseline",
        color: P.ink,
        fontFamily: FRAUNCES,
        fontSize,
        fontWeight: 900,
        letterSpacing: -fontSize * 0.03,
        lineHeight: 1,
      }}
    >
      <span>tr</span>
      <span style={{ display: "flex", position: "relative" }}>
        ı
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: Math.round(fontSize * 0.05),
            width: dot,
            height: dot,
            borderRadius: 999,
            backgroundColor: P.bronzeStrong,
            transform: "translateX(-50%)",
          }}
        />
      </span>
      <span>ta</span>
    </div>
  );
}

// ─── Hero-pirulák ikonjai (landing/icons.tsx egyszerűsített vonalai) ───────

function PillIcon({ kind }: { kind: "clock" | "flask" | "bolt" | "gift" }) {
  const common = {
    width: 13,
    height: 13,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: P.bronze,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (kind === "flask") {
    return (
      <svg {...common}>
        <path d="M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3" />
      </svg>
    );
  }
  if (kind === "bolt") {
    return (
      <svg {...common}>
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7c-2-3-6-3-6 0h6zm0 0c2-3 6-3 6 0h-6z" />
    </svg>
  );
}

// ─── Profil-előnézeti kártya (SelfPanel tükre) ─────────────────────────────

const DIMS = [
  { code: "H", key: "landing.selfDim1", value: 74 },
  { code: "E", key: "landing.selfDim2", value: 50 },
  { code: "X", key: "landing.selfDim3", value: 50 },
  { code: "A", key: "landing.selfDim4", value: 86 },
  { code: "C", key: "landing.selfDim5", value: 50 },
  { code: "O", key: "landing.selfDim6", value: 50 },
] as const;

const STRENGTHS = [
  { code: "A", key: "landing.selfDim4" },
  { code: "H", key: "landing.selfDim1" },
] as const;

const LIKELY_ROLES: Array<{ code: TeamRoleCode; color: string; width: string; rankKey: string }> = [
  { code: "CS", color: P.sage, width: "92%", rankKey: "landing.selfTeamRoleRank1" },
  { code: "KO", color: P.bronze, width: "79%", rankKey: "landing.selfTeamRoleRank2" },
];

function SelfPanelPreview() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 430,
        overflow: "hidden",
        borderRadius: 26,
        backgroundColor: P.card,
        boxShadow: "0 24px 64px rgba(26,26,46,.12), 0 1px 0 rgba(26,26,46,.04)",
      }}
    >
      {/* Sötét hero-fejléc */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "18px 24px 18px",
          backgroundImage: `linear-gradient(135deg, ${P.selfHeroFrom}, ${P.selfHeroMid} 55%, ${P.selfHeroTo})`,
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", color: "rgba(255,255,255,.7)" }}>
          {t("landing.selfPanelEyebrow", LOCALE)}
        </span>
        <span style={{ marginTop: 6, fontFamily: FRAUNCES, fontSize: 16, color: "rgba(255,255,255,.8)" }}>
          {t("landing.selfPanelName", LOCALE)}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
          <span style={{ fontFamily: FRAUNCES, fontSize: 25, fontWeight: 500, fontStyle: "italic", color: P.bronzeSoft }}>
            {t("landing.selfPanelType", LOCALE)}
          </span>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,.85)",
              backgroundColor: "rgba(255,255,255,.15)",
            }}
          >
            {t("landing.selfPanelRole", LOCALE)}
          </span>
        </div>
        <span style={{ marginTop: 8, maxWidth: 360, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,.75)" }}>
          {t("landing.selfPanelInsight", LOCALE)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", padding: "16px 20px 14px" }}>
        {/* Dimenzió-rács 3×2 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            overflow: "hidden",
            borderRadius: 12,
            border: `1px solid ${P.borderSoft}`,
          }}
        >
          {DIMS.map((dim, i) => {
            const colors = dimColors(dim.code);
            return (
              <div
                key={dim.code}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "33.3333%",
                  padding: "11px 6px 10px",
                  ...(i % 3 < 2 ? { borderRight: `1px solid ${P.borderSoft}` } : {}),
                  ...(i < 3 ? { borderBottom: `1px solid ${P.borderSoft}` } : {}),
                }}
              >
                <span style={{ fontSize: 10.5, color: P.muted }}>{t(dim.key, LOCALE)}</span>
                <span style={{ marginTop: 5, fontFamily: FRAUNCES, fontSize: 24, lineHeight: 1, color: colors.strong }}>
                  {dim.value}
                </span>
                <span
                  style={{
                    marginTop: 6,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 600,
                    backgroundColor: colors.soft,
                    color: colors.strong,
                  }}
                >
                  {getDimensionLabel(dim.value, LOCALE)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Erősségek */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: P.muted }}>
            {t("landing.selfStrLabel", LOCALE)}:
          </span>
          {STRENGTHS.map((s) => {
            const colors = dimColors(s.code);
            return (
              <span
                key={s.code}
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 500,
                  backgroundColor: colors.soft,
                  color: colors.strong,
                }}
              >
                {t(s.key, LOCALE)}
              </span>
            );
          })}
        </div>

        {/* Valószínű csapatszerepek */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase", color: P.muted }}>
            {t("landing.selfTeamRolesEyebrow", LOCALE)}
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 600,
              color: P.muted,
              backgroundColor: P.surfaceSubtle,
            }}
          >
            {t("landing.selfTeamRolesSource", LOCALE)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 8,
            overflow: "hidden",
            borderRadius: 12,
            border: `1px solid ${P.borderSoft}`,
          }}
        >
          {LIKELY_ROLES.map((role, index) => (
            <div
              key={role.code}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px 8px 14px",
                ...(index === 0
                  ? { borderBottom: `1px solid ${P.borderSoft}`, backgroundColor: "rgba(242,237,230,.45)" }
                  : {}),
              }}
            >
              <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: role.color, opacity: 0.7 }} />
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "white",
                  backgroundColor: role.color,
                  opacity: 0.9,
                }}
              >
                {index + 1}
              </span>
              <div style={{ display: "flex", flexDirection: "column", width: 150 }}>
                <span style={{ fontFamily: FRAUNCES, fontSize: 13, fontWeight: 500, color: P.ink }}>
                  {TEAM_ROLES[role.code][LOCALE]}
                </span>
                <span style={{ marginTop: 2, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: role.color, opacity: 0.6 }}>
                  {t(role.rankKey, LOCALE)}
                </span>
              </div>
              <div style={{ display: "flex", flex: 1, height: 4, overflow: "hidden", borderRadius: 999, backgroundColor: P.surfaceSubtle }}>
                <div style={{ width: role.width, height: "100%", borderRadius: 999, backgroundColor: role.color, opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lábléc */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 36,
          borderTop: `1px solid ${P.borderSoft}`,
          backgroundColor: P.surfaceSubtle,
          fontSize: 13,
          fontWeight: 500,
          color: P.sage,
        }}
      >
        {t("landing.selfFadeCta", LOCALE)}
      </div>
    </div>
  );
}

// ─── Címsor ────────────────────────────────────────────────────────────────

/**
 * A satori nem folyat szöveget egymás melletti span-ek között, ezért a cím
 * szavanként kerül a flex-wrap sorba: így a sortörés a szöveg természetes
 * helyére esik (mint a weben a text-balance), és a dőlt kiemelés nem szakad
 * külön sorba pusztán azért, mert önálló doboz.
 */
function Headline() {
  const words = [
    ...t("landing.ctaSelfHeadlineBefore", LOCALE).trim().split(" ").map((w) => ({ w, em: false })),
    ...t("landing.ctaSelfHeadlineEm", LOCALE).trim().split(" ").map((w) => ({ w, em: true })),
  ];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: 610,
        marginTop: 18,
        fontFamily: FRAUNCES,
        fontSize: 52,
        fontWeight: 500,
        lineHeight: 1.08,
        letterSpacing: -1.3,
        color: P.ink,
      }}
    >
      {words.map(({ w, em }, i) => (
        <span
          key={`${i}-${w}`}
          style={{
            marginRight: i === words.length - 1 ? 0 : 13,
            ...(em ? { fontStyle: "italic", color: P.bronzeMid } : {}),
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

// ─── Kép ───────────────────────────────────────────────────────────────────

export default async function OpengraphImage() {
  const og = (file: string) => readFile(path.join(process.cwd(), "assets/og", file));
  const [fraunces400, fraunces500, fraunces500Italic, fraunces900, dmSans400, dmSans500, dmSans600] =
    await Promise.all([
      og("Fraunces-400.ttf"),
      og("Fraunces-500.ttf"),
      og("Fraunces-500-Italic.ttf"),
      og("Fraunces-900.ttf"),
      og("DMSans-400.ttf"),
      og("DMSans-500.ttf"),
      og("DMSans-600.ttf"),
    ]);

  const pills: Array<{ kind: "clock" | "flask" | "bolt" | "gift"; key: string }> = [
    { kind: "clock", key: "landing.selfMetaTime" },
    { kind: "flask", key: "landing.selfMetaMethod" },
    { kind: "bolt", key: "landing.selfMetaInstant" },
    { kind: "gift", key: "landing.selfMetaFree" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          backgroundColor: P.cream,
          fontFamily: DM_SANS,
          color: P.ink,
        }}
      >
        {/* Bal: hero-szöveg */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 660,
            padding: "40px 0 40px 64px",
          }}
        >
          <Wordmark fontSize={52} />

          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 46, color: P.bronzeStrong }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: P.bronzeStrong }} />
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 2.2, textTransform: "uppercase" }}>
              {t("landing.focusedEyebrow", LOCALE)}
            </span>
          </div>

          <Headline />

          <div style={{ width: 560, marginTop: 22, fontSize: 21, lineHeight: 1.5, color: P.inkBody }}>
            {t("landing.focusedHeroSub", LOCALE)}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 30 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 52,
                padding: "0 28px",
                borderRadius: 14,
                fontSize: 17,
                fontWeight: 600,
                color: "white",
                backgroundColor: P.bronzeDark,
                boxShadow: "0 4px 14px rgba(154,101,56,.25)",
              }}
            >
              {t("landing.focusedHeroCta", LOCALE)}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
            {pills.map((pill) => (
              <div
                key={pill.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${P.sand}`,
                  backgroundColor: "rgba(255,255,255,.6)",
                  fontSize: 13,
                  color: P.inkBody,
                }}
              >
                <PillIcon kind={pill.kind} />
                <span>{t(pill.key, LOCALE)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Jobb: a valódi profil-előnézet (SelfPanel) teljes egészében */}
        <div style={{ position: "absolute", left: 726, top: 36, display: "flex" }}>
          <SelfPanelPreview />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: FRAUNCES, data: fraunces400, style: "normal", weight: 400 },
        { name: FRAUNCES, data: fraunces500, style: "normal", weight: 500 },
        { name: FRAUNCES, data: fraunces500Italic, style: "italic", weight: 500 },
        { name: FRAUNCES, data: fraunces900, style: "normal", weight: 900 },
        { name: DM_SANS, data: dmSans400, style: "normal", weight: 400 },
        { name: DM_SANS, data: dmSans500, style: "normal", weight: 500 },
        { name: DM_SANS, data: dmSans600, style: "normal", weight: 600 },
      ],
    },
  );
}
