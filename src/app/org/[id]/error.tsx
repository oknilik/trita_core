"use client";

export default function OrgError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center">
      <div className="text-center px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-2">
          // szervezet hiba
        </p>
        <h2 className="font-fraunces text-xl text-ink mb-3">
          Nem sikerült betölteni a szervezet adatait
        </h2>
        <p className="text-sm text-ink-body/60 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="min-h-[44px] rounded-lg border border-sand bg-white px-5 text-sm font-medium text-ink-body hover:border-sage/40"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
