"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/ui/cn";

interface QrCodeBadgeProps {
  /** Abszolút URL, vagy origin-relatív útvonal (pl. "/observe/abc") —
   *  utóbbit kliens-oldalon a window.location.origin egészíti ki. */
  value: string;
  /** Kép-alternatíva — i18n-elt szöveg a hívótól. */
  alt: string;
  /** Rövid használati útmutató a kód alatt (opcionális). */
  hint?: string;
  /** Generálási hiba — a hívó dönti el, hogyan jelzi (inline/toast). */
  onError?: () => void;
  className?: string;
}

/**
 * Közös QR-panel workshop-helyzetre: a meghívott a teremben, telefonnal
 * olvassa be a linket. A CompareInviteCard mintájából kiemelve — ink a kód,
 * krém a háttér (design-tokens), 240px-es PNG data-URL, kliens-oldalon
 * generálva (szerverre semmi nem megy).
 */
export function QrCodeBadge({ value, alt, hint, onError, className }: QrCodeBadgeProps) {
  // Az eredményt a forrás-értékkel EGYÜTT tároljuk: value-váltásnál a
  // származtatott dataUrl azonnal null (nincs elavult kód felvillanás),
  // szinkron setState-reset nélkül.
  const [generated, setGenerated] = useState<{ value: string; dataUrl: string } | null>(null);
  const dataUrl = generated?.value === value ? generated.dataUrl : null;
  // Ref-en át hívjuk, hogy egy inline onError callback se generáltassa újra
  // a kódot minden renderen.
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;
    const url = value.startsWith("/") ? `${window.location.origin}${value}` : value;
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      // SZÁNDÉKOSAN nem témázott: a QR mindig sötét modul / világos alap.
      // Az invertált (világos modul sötét alapon) QR-t a szkennerek jelentős
      // része nem olvassa — a sötét mód kedvéért nem kockáztatjuk a
      // működését. A kód a saját világos lapján ül a sötét felületen is.
      color: { dark: COLORS.ink, light: COLORS.cream },
    })
      .then((result) => {
        if (!cancelled) setGenerated({ value, dataUrl: result });
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current?.();
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!dataUrl) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-sand bg-cream/45 p-4",
        className,
      )}
    >
      <Image
        src={dataUrl}
        alt={alt}
        width={240}
        height={240}
        unoptimized
        className="h-[200px] w-[200px] rounded-lg border border-sand bg-surface-card p-2"
      />
      {hint ? <p className="max-w-sm text-center text-micro text-muted">{hint}</p> : null}
    </div>
  );
}
