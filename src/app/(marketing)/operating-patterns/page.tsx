import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo";
import { OperatingPatternExplorer } from "./OperatingPatternExplorer";

export const metadata = buildPageMetadata({
  path: "/operating-patterns",
  title: "Az együttműködésetek mintázatai | trita",
  description: "Értsétek meg a csapatotok működését, beszéljétek meg a tapasztalataitokat, és próbáljatok ki egy közös változtatást. Fedezzétek fel a T16 működési mintáit.",
});
export default function OperatingPatternsPage() {
  return <Suspense><OperatingPatternExplorer /></Suspense>;
}
