"use client";

import { useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { COLORS } from "@/lib/design-tokens";
import { track } from "@/lib/analytics/client";

interface ShareCardDownloadProps {
  userName: string;
  personalityType: string;
  topDims: Array<{ label: string; score: number }>;
  glyph: { primaryCode: string; secondaryCode: string; intensity: number };
}

const CARD_SIZE = 1080;

/**
 * A3: az archetípus-kártya képként — letöltés, mobilon Web Share.
 * Privacy-elv változatlan: a kép kliens-oldalon áll össze (a rejtett
 * TypeGlyph SVG-jét szerializáljuk canvas-ra), szerverre semmi nem megy;
 * pontszám nem kerül a képre, csak a top-2 dimenzió címkéje.
 * A tipográfiát a canvas rajzolja (document.fonts), így a betűk nem esnek
 * vissza rendszer-fontra, ahogy SVG-beli szövegnél történne.
 */
export function ShareCardDownload({
  userName,
  personalityType,
  topDims,
  glyph,
}: ShareCardDownloadProps) {
  const { locale } = useLocale();
  const glyphHostRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const buildPngBlob = async (): Promise<Blob> => {
    const svgEl = glyphHostRef.current?.querySelector("svg");
    if (!svgEl) throw new Error("NO_GLYPH");

    // Betűk előtöltése, hogy a canvas fillText már a webfontokkal rajzoljon.
    try {
      await Promise.all([
        document.fonts.load('600 60px "Fraunces"'),
        document.fonts.load('italic 400 44px "Fraunces"'),
        document.fonts.ready,
      ]);
    } catch {
      // font-betöltési hiba nem blokkoló — fallback betűvel is olvasható
    }

    const serialized = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("SVG_LOAD"));
        img.src = svgUrl;
      });

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      canvas.width = CARD_SIZE * dpr;
      canvas.height = CARD_SIZE * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("NO_CANVAS");
      ctx.scale(dpr, dpr);

      // Háttér + a glyph felül középen
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
      const glyphWidth = 620;
      const glyphHeight = (glyphWidth / image.width) * image.height;
      ctx.drawImage(image, (CARD_SIZE - glyphWidth) / 2, 48, glyphWidth, glyphHeight);

      // Tipográfia — a saját eredmény-oldal hierarchiája: név, archetípus, dimenziók
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.ink;
      ctx.font = '600 60px "Fraunces", serif';
      ctx.fillText(userName, CARD_SIZE / 2, 812, CARD_SIZE - 120);

      ctx.fillStyle = COLORS.bronze;
      ctx.font = 'italic 400 44px "Fraunces", serif';
      ctx.fillText(personalityType, CARD_SIZE / 2, 874, CARD_SIZE - 120);

      if (topDims.length > 0) {
        ctx.fillStyle = COLORS.inkBody;
        ctx.font = '400 28px "DM Sans", sans-serif';
        ctx.fillText(
          topDims.map((d) => d.label).join("  ·  "),
          CARD_SIZE / 2,
          932,
          CARD_SIZE - 120,
        );
      }

      // Szignó
      ctx.fillStyle = COLORS.ink;
      ctx.font = '700 34px "Fraunces", serif';
      ctx.fillText("trita", CARD_SIZE / 2, 1006);
      ctx.fillStyle = COLORS.ink300;
      ctx.font = '400 22px "DM Sans", sans-serif';
      ctx.fillText(window.location.origin.replace(/^https?:\/\//, ""), CARD_SIZE / 2, 1040);

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("NO_BLOB"))),
          "image/png",
        );
      });
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  const handleClick = async () => {
    setBusy(true);
    setError(false);
    try {
      const blob = await buildPngBlob();
      const file = new File([blob], "trita-tipuskartya.png", { type: "image/png" });

      // Mobilon natív megosztás; máshol letöltés.
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: personalityType });
          return;
        } catch (err) {
          // A user által megszakított share nem hiba — csend; másra: letöltés-fallback.
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "trita-tipuskartya.png";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Rejtett, teljes méretű glyph — ebből szerializálunk. A modal-beli
          kis badge-változat helyett a card-variánst rajzoljuk a képre. */}
      <div ref={glyphHostRef} aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 h-[400px] w-[360px]">
        <TypeGlyph
          primaryCode={glyph.primaryCode}
          secondaryCode={glyph.secondaryCode}
          typeLabel={personalityType}
          locale={locale === "hu" ? "hu" : "en"}
          intensity={glyph.intensity}
          variant="card"
        />
      </div>

      {/* Halk, másodlagos szöveg-link (nem kártya-blokk): a modal fő akciói
          a link-másolás és az email-küldés — a kép-letöltés kiegészítő út. */}
      <button
        type="button"
        onClick={() => {
          // A6: a megosztó-kép mint kimenet.
          track("results.export", { format: "image" });
          void handleClick();
        }}
        disabled={busy}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-caption font-medium text-muted underline decoration-sand underline-offset-4 transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? t("results.shareCardWorking", locale)
          : t("results.shareCardDownload", locale)}
      </button>
      {error ? (
        <p className="mt-1 text-xs text-state-error-fg">
          {t("results.compareError", locale)}
        </p>
      ) : null}
    </div>
  );
}
