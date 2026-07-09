"use client";

export default function AssessmentError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="text-center px-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Hiba a teszt betöltésekor
        </h2>
        <p className="text-sm text-gray-600 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="min-h-[44px] rounded-xl bg-indigo-600 px-6 text-sm font-medium text-white hover:bg-indigo-700 transition"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
