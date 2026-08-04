import type { Metadata } from "next";
import { HollandContent } from "./HollandContent";

export const metadata: Metadata = {
  title: "Mi az a Holland-kód? — RIASEC érdeklődés-típusok | trita",
  description:
    "A Holland-kód (RIASEC) hat érdeklődés-típusa érthetően: Megvalósító, Elemző, Alkotó, Segítő, Meggyőző, Rendszerező. Mit jelentenek a betűk, és hogyan olvasd a saját kódodat?",
  alternates: { canonical: "/holland-kod" },
  openGraph: {
    title: "Mi az a Holland-kód? — RIASEC érthetően",
    description:
      "Hat érdeklődés-típus, ami megmutatja, milyen munka tölt fel — betűnkénti magyarázattal és példa-szerepekkel.",
    url: "/holland-kod",
    siteName: "trita",
    locale: "hu_HU",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function HollandCodePage() {
  return <HollandContent />;
}
