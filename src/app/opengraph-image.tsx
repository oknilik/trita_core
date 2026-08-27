import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/design-tokens";

export const alt = "trita – személyiség- és csapatintelligencia platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Statikus (nem variable) font-példányok: a satori nem tud variable TTF-et.
  const [fraunces, dmSans] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/og/Fraunces-400.ttf")),
    readFile(path.join(process.cwd(), "assets/og/DMSans-400.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.cream,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              backgroundColor: COLORS.bronze,
            }}
          />
          <div
            style={{
              fontFamily: "DM Sans",
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLORS.sage,
            }}
          >
            trita
          </div>
        </div>
        <div
          style={{
            fontFamily: "Fraunces",
            fontSize: 74,
            lineHeight: 1.15,
            color: COLORS.ink,
            maxWidth: 980,
          }}
        >
          Személyiség- és csapatintelligencia platform
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "DM Sans",
              fontSize: 28,
              color: COLORS.inkBody,
            }}
          >
            Mérhető csapatdinamika · 360° visszajelzés
          </div>
          <div
            style={{
              width: 120,
              height: 6,
              borderRadius: 9999,
              backgroundColor: COLORS.bronze,
            }}
          />
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
