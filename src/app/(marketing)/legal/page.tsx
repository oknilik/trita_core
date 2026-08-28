import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { LegalHubContent } from "./LegalHubContent";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/legal",
    title: "Jogi dokumentumok | trita",
    description: "A Trita hatályos jogi tájékoztatója és ügyvédi felülvizsgálat alatt álló szerződéses tervezetei.",
  }),
  robots: { index: false, follow: true },
};

export default function LegalPage() {
  return <LegalHubContent />;
}
