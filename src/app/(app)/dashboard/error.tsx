"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-xl rounded-[24px] border border-sand bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(26,26,46,0.04)] md:px-8">
        <p className="text-micro font-semibold uppercase tracking-widest text-bronze/85">
          Szervezeti cockpit
        </p>
        <h2 className="mt-3 font-fraunces text-[30px] leading-none tracking-tight text-ink md:text-[34px]">
          Hiba a betöltés közben
        </h2>
        <p className="mx-auto mt-3 max-w-md text-caption leading-relaxed text-ink-body">
          {error.message || "Valami megszakította a dashboard betöltését."}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-[var(--color-accent-primary)] px-6 text-[12px] font-semibold text-white transition hover:brightness-110"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
