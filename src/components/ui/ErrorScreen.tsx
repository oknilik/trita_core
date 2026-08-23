"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
// A PUBLIKUS szótárból dolgozunk: a gyökér error.tsx a marketing-fa hibáit is
// fogja, és a teljes app-szótár behúzása visszahozná a 110 KB-os chunkot a
// publikus bundle-be. Az errors.* kulcsok a common domainben élnek — mindkét
// szótár feloldja őket.
import { t } from "@/lib/i18n/public";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { createClientLogger } from "@/lib/client-logger";

const log = createClientLogger("error-boundary");

/**
 * Közös hibahatár-képernyő az error.tsx oldalaknak.
 *
 * Elvek (2026-08-17, P1.5):
 *  - A nyers `error.message` NEM kerül a felhasználó elé — technikai, angol,
 *    és belső részletet szivárogtathat. Helyette i18n-es semleges szöveg.
 *  - A `digest` (Next szerver-hiba hash) kis hibakódként megjelenik, hogy a
 *    support-beszélgetésben azonosítható legyen.
 *  - A hibát a client-logger rögzíti — a hibahatár eddig némán nyelte el.
 */
export function ErrorScreen({
  error,
  reset,
  titleKey,
  surface,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** i18n kulcs a címhez (errors.* névtér), pl. "errors.teamTitle". */
  titleKey: string;
  /** Telemetria-címke: melyik hibahatár fogta a hibát. */
  surface: string;
}) {
  const { locale } = useLocale();

  useEffect(() => {
    log.error(
      { event: "error_boundary.caught", surface, err: error, digest: error.digest },
      "Route error boundary caught an error",
    );

    // …és jelentés a szervernek. A konzol-log a LÁTOGATÓ gépén marad: enélkül
    // a felhasználó hibaképernyőt lát, mi pedig semmit sem tudunk róla.
    // Best effort: ha a jelentés elbukik (offline, blokkolt kérés), a
    // hibaképernyő ettől még működik — a hibát nem tetézzük.
    //
    // A `keepalive` azért kell, mert a felhasználó tipikusan azonnal
    // továbblép vagy frissít: enélkül a böngésző eldobná a kérést.
    const payload = JSON.stringify({
      surface,
      name: error.name,
      // Csak az üzenet feje, stack nélkül — a szerver-oldali séma is csonkol.
      message: error.message?.slice(0, 500),
      ...(error.digest ? { digest: error.digest } : {}),
      // Query és hash nélkül: azok azonosítót vihetnének (token, invite id).
      path: window.location.pathname,
    });

    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }, [error, surface]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4">
      <div className="max-w-md px-6 text-center">
        <SectionEyebrow className="mb-2">{t("errors.eyebrow", locale)}</SectionEyebrow>
        <h1 className="mb-3 font-fraunces text-2xl text-ink">{t(titleKey, locale)}</h1>
        <p className="mb-6 text-sm text-ink-body/70">{t("errors.body", locale)}</p>
        <button
          onClick={reset}
          className="min-h-[44px] rounded-lg bg-sage px-6 py-3 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
        >
          {t("errors.retry", locale)}
        </button>
        {error.digest && (
          <p className="mt-5 font-mono text-micro uppercase tracking-widest text-muted">
            {t("errors.errorCode", locale)}: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
