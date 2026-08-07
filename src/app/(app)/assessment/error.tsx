"use client";

export default function AssessmentError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-sage-ghost via-sage-ghost to-state-error-bg">
      <div className="text-center px-6">
        <h2 className="text-xl font-semibold text-ink mb-3">
          Hiba a teszt betöltésekor
        </h2>
        <p className="text-sm text-ink-body mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="min-h-[44px] rounded-xl bg-sage px-6 text-sm font-medium text-white hover:bg-sage-dark transition"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
