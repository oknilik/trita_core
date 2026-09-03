import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/design-tokens";

export const alt = "trita – értsétek meg jobban a csapatotok működését";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TEAM = {
  accent: "#c18aaa", glow: "#e1a65f", heroFrom: "#66455d",
  heroMid: "#4a314a", heroTo: "#2f2035", surface: "#202027",
  surfaceSoft: "#292933", border: "#363640", page: "#111114",
} as const;

function Wordmark() {
  return (
    <div aria-label="trita" style={{ display: "flex", alignItems: "baseline", color: COLORS.cream, fontFamily: "Fraunces", fontSize: 64, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>
      <span>tr</span>
      <span style={{ display: "flex", position: "relative" }}>
        ı
        <span style={{ position: "absolute", left: "50%", top: -1, width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS.bronze, transform: "translateX(-50%)" }} />
      </span>
      <span>ta</span>
    </div>
  );
}

function TeamPreviewCard() {
  const axes = [
    { label: "Hajtóerő", value: 81, color: TEAM.accent },
    { label: "Kohézió", value: 64, color: "#77bea6" },
    { label: "Fegyelem", value: 55, color: TEAM.glow },
    { label: "Nyitottság", value: 56, color: "#6972bc" },
  ];

  return (
    <div style={{ position: "absolute", right: -26, top: 64, width: 430, height: 600, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 30, border: `1px solid ${TEAM.border}`, backgroundColor: TEAM.surface, boxShadow: "0 30px 80px rgba(0,0,0,.48)", transform: "rotate(-1.2deg)" }}>
      <div style={{ display: "flex", flexDirection: "column", padding: "34px 34px 30px", color: "white", backgroundImage: `linear-gradient(135deg, ${TEAM.heroFrom}, ${TEAM.heroMid} 55%, ${TEAM.heroTo})` }}>
        <span style={{ fontSize: 14, letterSpacing: 2.4, color: "rgba(255,255,255,.68)" }}>JÓVÁHAGYOTT CSAPATKÉP</span>
        <span style={{ marginTop: 14, fontFamily: "Fraunces", fontSize: 31 }}>Értékesítés</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <span style={{ fontFamily: "Fraunces", fontSize: 31, color: TEAM.glow, fontStyle: "italic" }}>Családi Vállalkozás</span>
          <span style={{ padding: "5px 10px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,.88)", backgroundColor: "rgba(255,255,255,.14)" }}>Publikált</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", padding: "25px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, letterSpacing: 2, color: "#aaa5a0" }}>KÉT NÉZŐPONT, EGY CSAPATKÉP</span>
          <span style={{ padding: "5px 10px", borderRadius: 999, fontSize: 13, color: "#c9c5c1", backgroundColor: TEAM.surfaceSoft }}>5 tag · 100%</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 18, padding: 20, borderRadius: 18, backgroundColor: TEAM.surfaceSoft }}>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.7, color: TEAM.accent }}>4 MŰKÖDÉSI ELV</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 17, marginTop: 20 }}>
            {axes.map((axis) => (
              <div key={axis.label} style={{ display: "flex", alignItems: "center" }}>
                <span style={{ width: 92, fontSize: 15, color: "#d2ceca" }}>{axis.label}</span>
                <div style={{ display: "flex", width: 210, height: 8, overflow: "hidden", borderRadius: 999, backgroundColor: "#3b3b47" }}>
                  <div style={{ width: `${axis.value}%`, height: "100%", borderRadius: 999, backgroundColor: axis.color }} />
                </div>
                <span style={{ width: 34, marginLeft: 10, fontSize: 14, color: "#d2ceca" }}>{axis.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 16, gap: 12 }}>
          <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: 16, borderRadius: 16, backgroundColor: TEAM.surfaceSoft }}>
            <span style={{ fontSize: 13, letterSpacing: 1.3, color: TEAM.accent }}>ERŐSSÉG</span>
            <span style={{ marginTop: 8, fontSize: 15, lineHeight: 1.35, color: "#d2ceca" }}>Gyors közös mozgás</span>
          </div>
          <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: 16, borderRadius: 16, backgroundColor: TEAM.surfaceSoft }}>
            <span style={{ fontSize: 13, letterSpacing: 1.3, color: TEAM.glow }}>FIGYELJ RÁ</span>
            <span style={{ marginTop: 8, fontSize: 15, lineHeight: 1.35, color: "#d2ceca" }}>Legyen tér kérdezni</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function OpengraphImage() {
  const [fraunces, dmSans] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/og/Fraunces-400.ttf")),
    readFile(path.join(process.cwd(), "assets/og/DMSans-400.ttf")),
  ]);

  return new ImageResponse(
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", overflow: "hidden", backgroundColor: TEAM.page, fontFamily: "DM Sans" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "radial-gradient(circle at 82% 18%, rgba(193,138,170,.13), transparent 34%), radial-gradient(circle at 4% 96%, rgba(193,127,74,.09), transparent 30%)" }} />
      <div style={{ position: "relative", width: 780, display: "flex", flexDirection: "column", padding: "58px 0 54px 66px" }}>
        <Wordmark />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 48, color: TEAM.accent }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: TEAM.accent }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2.5 }}>KÖZÖS KÉP A CSAPATOTOKRÓL</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 22, fontFamily: "Fraunces", fontSize: 57, lineHeight: 1.03, letterSpacing: -1.6, color: COLORS.cream }}>
          <span>Értsétek meg jobban a</span>
          <span style={{ color: TEAM.accent, fontStyle: "italic" }}>csapatotok működését.</span>
        </div>
        <div style={{ width: 650, marginTop: 28, fontSize: 22, lineHeight: 1.45, color: "#bbb6b0" }}>Lássátok, mi tart össze benneteket, hol keletkezik feszültség, és mire építhettek együtt.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30 }}>
          <div style={{ display: "flex", alignItems: "center", height: 48, padding: "0 24px", borderRadius: 14, fontSize: 17, fontWeight: 700, color: "white", backgroundColor: TEAM.heroFrom }}>trita Team Scan</div>
          <span style={{ fontSize: 17, color: TEAM.accent }}>trita.io</span>
        </div>
      </div>
      <TeamPreviewCard />
    </div>,
    { ...size, fonts: [
      { name: "Fraunces", data: fraunces, style: "normal", weight: 400 },
      { name: "Fraunces", data: fraunces, style: "normal", weight: 700 },
      { name: "DM Sans", data: dmSans, style: "normal", weight: 400 },
      { name: "DM Sans", data: dmSans, style: "normal", weight: 700 },
    ] },
  );
}
