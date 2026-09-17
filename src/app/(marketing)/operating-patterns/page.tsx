import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo";
import { OperatingPatternExplorer } from "./OperatingPatternExplorer";

export const metadata = buildPageMetadata({
  path: "/operating-patterns",
  title: "16 működési minta – Csapatkép | trita",
  description: "Négy működési tengely, tizenhat csapatminta. Fedezd fel a jelenlegi csapatműködés kísérleti, leíró térképét.",
});
export default function OperatingPatternsPage() {
  return <Suspense><OperatingPatternExplorer /></Suspense>;
}
