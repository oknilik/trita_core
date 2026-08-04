import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

export const alt = "trita blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BlogOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? "trita blog";
  const tag = post?.tags[0];
  const isHu = post?.locale !== "en";

  // Statikus (nem variable) font-példányok: a satori nem tud variable TTF-et.
  const [fraunces, dmSans] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/og/Fraunces-400.ttf")),
    readFile(path.join(process.cwd(), "assets/og/DMSans-400.ttf")),
  ]);

  // Hosszú címnél kisebb betű, hogy ne csorduljon ki a vászonról.
  const fontSize = title.length > 70 ? 52 : title.length > 45 ? 60 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f7f4ef",
          padding: "72px 80px",
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
            trita blog
          </div>
          {tag ? (
            <div
              style={{
                marginLeft: 12,
                fontFamily: "DM Sans",
                fontSize: 22,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "#c17f4a",
                border: "2px solid #e8c7b8",
                borderRadius: 9999,
                padding: "6px 18px",
              }}
            >
              {tag}
            </div>
          ) : null}
        </div>
        <div
          style={{
            fontFamily: "Fraunces",
            fontSize,
            lineHeight: 1.18,
            color: "#1a1a2e",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontFamily: "DM Sans", fontSize: 26, color: "#5a5a6e" }}>
            {isHu
              ? "Csapatdinamika, személyiség, tudatos HR"
              : "Team dynamics, personality, intentional HR"}
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
