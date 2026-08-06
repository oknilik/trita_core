import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { HollandContent } from "./HollandContent";

export const metadata: Metadata = buildPageMetadata({
  path: "/holland-kod",
  title: "Mi az a Holland-kód? — RIASEC érdeklődés-típusok | trita",
  description:
    "A Holland-kód (RIASEC) hat érdeklődés-típusa érthetően: Megvalósító, Elemző, Alkotó, Segítő, Meggyőző, Rendszerező. Mit jelentenek a betűk, és hogyan olvasd?",
  ogTitle: "Mi az a Holland-kód? — RIASEC érthetően",
  ogDescription:
    "Hat érdeklődés-típus, ami megmutatja, milyen munka tölt fel — betűnkénti magyarázattal és példa-szerepekkel.",
});

export default function HollandCodePage() {
  return <HollandContent />;
}
