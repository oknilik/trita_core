import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { LegalHubContent } from "./LegalHubContent";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/legal",
    title: "Jogi dokumentumok | trita",
    description: "A Trita hatályos Platform Feltételei, B2B Feltételei, Adatfeldolgozási Megállapodása és Adatvédelmi tájékoztatója.",
  }),
};

export default function LegalPage() {
  return <LegalHubContent />;
}
