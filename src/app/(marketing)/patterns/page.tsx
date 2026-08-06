import { Suspense } from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { PatternExplorer } from "./PatternExplorer";

export const metadata: Metadata = buildPageMetadata({
  path: "/patterns",
  title: "16 csapatminta — Trita Csapatminta Felfedező",
  description:
    "Fedezd fel a 16 csapatműködési mintázatot: húzd a csúszkákat, és nézd meg, melyik minta illik a csapatodra. Hatfaktoros személyiségmodellre épülő diagnosztika.",
  ogTitle: "16 csapatminta — Melyik a tiéd?",
  ogDescription:
    "Interaktív csapatminta felfedező. 4 tengely, 16 mintázat, személyre szabott meglátások.",
});

export default function PatternsPage() {
  return (
    <Suspense>
      <PatternExplorer />
    </Suspense>
  );
}
