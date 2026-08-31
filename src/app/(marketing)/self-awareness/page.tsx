import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";
import { SEO_INTENTS } from "@/lib/seo-intents";

const seoIntent = SEO_INTENTS.selfAwareness;
const path = seoIntent.path;
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
          about: seoIntent.topics,
          breadcrumb: [
            { name: "Főoldal", path: "/" },
            { name: "Önismereti személyiségteszt", path },
          ],
        })}
      />
      <LandingContent initialMode="self" />
    </main>
  );
}
