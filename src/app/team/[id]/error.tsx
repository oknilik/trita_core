"use client";

export default function TeamError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-[#faf9f6] flex items-center justify-center">
      <div className="text-center px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-2">
          // csapat hiba
        </p>
        <h2 className="font-playfair text-xl text-[#1a1814] mb-3">
          Nem sikerült betölteni a csapat adatait
        </h2>
        <p className="text-sm text-[#3d3a35]/60 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="min-h-[44px] rounded-lg border border-[#e8e4dc] bg-white px-5 text-sm font-medium text-[#3d3a35] hover:border-[#c8410a]/40"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
