"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    // Gyökér-hibahatár: a root layout (Theme/LocaleProvider) még fut
    // körülötte, de más layout nem — a téma-hatókört magának kell felvennie.
    <div className="theme-scope">
      <ErrorScreen error={error} reset={reset} titleKey="errors.genericTitle" surface="root" />
    </div>
  );
}
