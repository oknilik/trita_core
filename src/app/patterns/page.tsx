import { Suspense } from "react";
import type { Metadata } from "next";
import { PatternExplorer } from "./PatternExplorer";

export const metadata: Metadata = {
  title: "16 csapatminta — Trita Csapatminta Felfedező",
  description:
    "Fedezd fel a 16 csapatműködési mintázatot. Interaktív eszköz: húzd a csúszkákat, és nézd meg, melyik mintázat illik a csapatodra. HEXACO-alapú csapatdiagnosztika.",
  openGraph: {
    title: "16 csapatminta — Melyik a tiéd?",
    description:
      "Interaktív csapatminta felfedező. 4 tengely, 16 mintázat, személyre szabott insightok.",
    url: "https://trita.io/patterns",
    siteName: "Trita",
    locale: "hu_HU",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function PatternsPage() {
  return (
    <Suspense>
      <PatternExplorer />
    </Suspense>
  );
}
