"use client";

import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    // Gyökér-hibahatár: EGYETLEN layout sem fut körülötte, csak a root —
    // a hatókört ezért magának kell felvennie.
    <div className="theme-scope flex min-h-dvh items-center justify-center bg-cream">
      <div className="max-w-md px-6 text-center">
        <SectionEyebrow className="mb-2">hiba történt</SectionEyebrow>
        <h1 className="font-fraunces text-2xl text-ink mb-4">
          Valami félrement
        </h1>
        <p className="text-sm text-ink-body/70 mb-6">
          {error.message || "Próbáld újra."}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-sage px-6 py-3 text-sm font-semibold text-[var(--color-action-primary-fg)] hover:bg-sage-dark transition min-h-[44px]"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
