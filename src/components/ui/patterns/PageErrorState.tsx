"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { createClientLogger } from "@/lib/client-logger";
import { PlatformPageShell, type PlatformSurface } from "@/components/layout/PlatformPageShell";
import { Button, getButtonClassName } from "@/components/ui/primitives/Button";
import { t } from "@/lib/i18n";

const log = createClientLogger("error-boundary");

type BoundaryError = Error & { digest?: string };

function errorReference(error: BoundaryError): string {
  if (error.digest) return error.digest.slice(0, 12).toUpperCase();
  let hash = 0;
  for (const char of error.message || error.name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `TR-${hash.toString(16).toUpperCase().padStart(8, "0")}`;
}

export function PageErrorState({
  error,
  reset,
  surface = "self",
}: {
  error: BoundaryError;
  reset: () => void;
  surface?: PlatformSurface;
}) {
  const { locale } = useLocale();
  const reference = errorReference(error);

  // A hibahatár korábban NÉMÁN nyelte el a hibát: a felhasználó látta a
  // képernyőt, mi viszont semmit. A referencia ugyanaz, amit a felület mutat,
  // így a support-beszélgetés és a log összeköthető.
  useEffect(() => {
    log.error(
      { event: "error_boundary.caught", surface, err: error, digest: error.digest, reference },
      "Route error boundary caught an error",
    );
  }, [error, surface, reference]);

  return (
    <PlatformPageShell surface={surface} contentClassName="max-w-3xl px-4 py-12">
      <section role="alert" className="rounded-[20px] border border-state-error-border bg-surface-card p-5 shadow-[var(--ui-shadow-sm)] md:p-7">
        <p className="text-label uppercase tracking-widest text-state-error-fg">
          {t("pageState.errorEyebrow", locale)}
        </p>
        <div className="mt-4 grid grid-cols-[44px_minmax(0,1fr)] gap-3">
          <div aria-hidden className="grid size-11 place-items-center rounded-[14px] bg-state-error-bg text-lg font-bold text-state-error-fg">!</div>
          <div>
            <h1 className="font-fraunces text-2xl tracking-tight text-text-primary">
              {t("pageState.errorTitle", locale)}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {t("pageState.errorBody", locale)}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 pl-14">
          <Button type="button" onClick={reset}>{t("pageState.retry", locale)}</Button>
          <Link href="/dashboard" className={getButtonClassName({ variant: "secondary" })}>
            {t("pageState.dashboard", locale)}
          </Link>
        </div>
        <p className="mt-4 pl-14 text-micro text-text-muted">
          {t("pageState.reference", locale)}: {reference}
        </p>
      </section>
    </PlatformPageShell>
  );
}
