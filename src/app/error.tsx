"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream">
      <div className="max-w-md px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-2">
          // hiba történt
        </p>
        <h1 className="font-fraunces text-2xl text-ink mb-4">
          Valami félrement
        </h1>
        <p className="text-sm text-ink-body/70 mb-6">
          {error.message || "Kérjük, próbáld újra."}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-sage px-6 py-3 text-sm font-semibold text-white hover:bg-sage-dark transition min-h-[44px]"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
