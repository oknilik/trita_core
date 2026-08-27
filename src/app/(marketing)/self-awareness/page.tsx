import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";

const path = "/self-awareness";
const title = "Önismereti személyiségteszt és egyéni profil | trita";
const description =
  "Ismerd meg a személyiséged fő mintázatait, erősségeidet és természetes csapatszerepeidet egy ingyenes, hatdimenziós felméréssel.";

export const metadata: Metadata = buildPageMetadata({
  path,
  title,
  description,
  ogTitle: "Önismeret és egyéni személyiségprofil | trita",
});

export default function SelfAwarenessPage() {
  return (
    <main className="min-h-screen bg-cream">
      <JsonLd
        data={buildWebPageJsonLd({
          path,
          title,
          description,
          about: ["Önismeret", "Személyiségteszt", "Csapatszerepek"],
        })}
      />
      <LandingContent initialMode="self" />
    </main>
  );
}
