import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { loadShareOgModel } from "@/lib/share-og";
import {
  DIMENSION_GLYPHS,
  FORM_GEOMETRY,
  GLYPH_COLORS,
} from "@/lib/type-glyph";

// A megosztott profil link-előnézete (Slack/LinkedIn/iMessage): a felhasználó
// archetípus-kártyája a generikus site-kártya helyett. A robots noindex a
// page-en marad — az OG-kép attól még működik előnézetként. Érvénytelen vagy
// visszavont tokenre generikus brand-képet adunk (sosem 500).
export const alt = "trita — személyiségprofil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A domináns dimenzió bronz alapformájának egyszerűsített sziluettje.
// A teljes glyph-kompozíció (motívum, kísérő elemek, intenzitás-textúra)
// szándékosan nem kerül ide: a satori SVG-támogatása korlátos, az
// OG-méretben a tiszta forma olvashatóbb.
function GlyphSilhouette({ primaryCode }: { primaryCode: string }) {
  const glyph = DIMENSION_GLYPHS[primaryCode];
  const geometry = glyph ? FORM_GEOMETRY[glyph.form] : null;
  if (!geometry) return null;

  return (
    <svg
      width="430"
      height="430"
      viewBox="110 210 620 560"
      style={{ display: "flex" }}
    >
      {geometry.path ? <path d={geometry.path} fill={GLYPH_COLORS.form} /> : null}
      {(geometry.discs ?? []).map((disc, i) => (
        <circle key={i} cx={disc.cx} cy={disc.cy} r={disc.r} fill={GLYPH_COLORS.form} />
      ))}
      {geometry.accent.kind === "dot" ? (
        <circle
          cx={geometry.accent.x}
          cy={geometry.accent.y}
          r={geometry.accent.r + 4}
          fill={geometry.accent.color === "form" ? GLYPH_COLORS.form : GLYPH_COLORS.line}
        />
      ) : (
        <circle
          cx={geometry.accent.x}
          cy={geometry.accent.y}
          r={geometry.accent.r}
          fill="none"
          stroke={GLYPH_COLORS.form}
          strokeWidth={10}
        />
      )}
    </svg>
  );
}

export default async function ShareOpengraphImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Az OG-crawlernek nincs nyelvi kontextusa (cookie/fejléc) — a termék
  // HU-first, a kép szövege magyar.
  const model = await loadShareOgModel(token, "hu");

  const [fraunces, dmSans] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/og/Fraunces-400.ttf")),
    readFile(path.join(process.cwd(), "assets/og/DMSans-400.ttf")),
  ]);

  const typeLabel = model.typeLabel;
  const heading = typeLabel ?? "Személyiségprofil";
  const fontSize = heading.length > 24 ? 64 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#f7f4ef",
        }}
      >
        {/* Bal: glyph-sziluett vagy generikus brand-jel */}
        <div
          style={{
            width: 470,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {model.primaryCode ? (
            <GlyphSilhouette primaryCode={model.primaryCode} />
          ) : (
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 9999,
                backgroundColor: "#c17f4a",
                display: "flex",
              }}
            />
          )}
        </div>

        {/* Jobb: név + archetípus + szignó */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px 72px 8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 9999,
                backgroundColor: "#c17f4a",
              }}
            />
            <div
              style={{
                fontFamily: "DM Sans",
                fontSize: 26,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "#3d6b5e",
              }}
            >
              trita · személyiségprofil
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {model.displayName ? (
              <div
                style={{
                  fontFamily: "DM Sans",
                  fontSize: 30,
                  color: "#5a5a6e",
                }}
              >
                {model.displayName}
              </div>
            ) : null}
            <div
              style={{
                fontFamily: "Fraunces",
                fontSize,
                lineHeight: 1.12,
                color: "#1a1a2e",
                maxWidth: 620,
              }}
            >
              {heading}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontFamily: "DM Sans", fontSize: 24, color: "#5a5a6e" }}>
              Önértékelés + külső visszajelzés, tudományos alapon
            </div>
            <div
              style={{
                width: 120,
                height: 6,
                borderRadius: 9999,
                backgroundColor: "#c17f4a",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, style: "normal", weight: 400 },
        { name: "DM Sans", data: dmSans, style: "normal", weight: 400 },
      ],
    },
  );
}
