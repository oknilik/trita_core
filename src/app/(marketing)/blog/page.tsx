import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { buildPageMetadata } from "@/lib/seo";
import { BlogListContent } from "./BlogListContent";

export const metadata: Metadata = buildPageMetadata({
  path: "/blog",
  title: "Blog — csapatdinamika, személyiség, tudatos HR | trita",
  description:
    "Cikkek csapatdinamikáról, személyiségpszichológiáról és tudatos HR-ről: hogyan olvasd a csapatod működését, mit mér a HEXACO, és mikor téved az önértékelés.",
  ogTitle: "trita blog — csapatdinamika és személyiség",
  ogDescription:
    "Cikkek csapatdinamikáról, személyiségpszichológiáról és tudatos HR-ről.",
});

// Statikus oldal: a posztlista mindkét nyelven build-time készül, a nyelvet
// a kliens-oldali LocaleProvider választja.
export default function BlogListPage() {
  // Dev-ben a piszkozatok is látszanak (ott íródnak-ellenőrződnek);
  // élesben csak a publikált cikkek kerülnek a listába.
  const includeDrafts = process.env.NODE_ENV === "development";
  const postsByLocale = {
    hu: getAllPosts("hu", { includeDrafts }),
    en: getAllPosts("en", { includeDrafts }),
  };

  return <BlogListContent postsByLocale={postsByLocale} />;
}
