import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildBlogJsonLd, buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { BlogListContent } from "./BlogListContent";

export const metadata: Metadata = buildPageMetadata({
  path: "/blog",
  title: "Blog — csapatdinamika, személyiség, tudatos HR | trita",
  description:
    "Cikkek csapatdinamikáról, személyiségpszichológiáról és tudatos HR-ről: hogyan olvasd a csapatod működését, mit mérnek a személyiségdimenziók, és mikor téved az önértékelés.",
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

  // A Blog-entitás a PUBLIKÁLT (nem draft) magyar cikkekből épül — a
  // prerenderelt HTML nyelve is magyar. A draftokat a `getAllPosts` élesben
  // amúgy is kiszűri; a dev-beli `includeDrafts` listát szándékosan NEM
  // használjuk itt, hogy piszkozat soha ne szivárogjon strukturált adatba.
  const publishedHuPosts = getAllPosts("hu");

  return (
    <>
      <JsonLd
        data={[
          buildBlogJsonLd({
            name: "trita blog",
            description:
              "Cikkek csapatdinamikáról, személyiségpszichológiáról és tudatos HR-ről.",
            path: "/blog",
            posts: publishedHuPosts.map((post) => ({
              title: post.title,
              description: post.description,
              path: `/blog/${post.slug}`,
              datePublished: post.publishedAt,
            })),
          }),
          buildBreadcrumbJsonLd([
            { name: "Főoldal", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
      <BlogListContent postsByLocale={postsByLocale} />
    </>
  );
}
