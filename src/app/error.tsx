"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6]">
      <div className="max-w-md px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-2">
          // hiba történt
        </p>
        <h1 className="font-playfair text-2xl text-[#1a1814] mb-4">
          Valami félrement
        </h1>
        <p className="text-sm text-[#3d3a35]/70 mb-6">
          {error.message || "Kérjük, próbáld újra."}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[#c8410a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a8340a] transition min-h-[44px]"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
