import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogListContent } from "./BlogListContent";

export const metadata: Metadata = {
  title: "Blog | trita",
  description:
    "Cikkek csapatdinamikáról, személyiségpszichológiáról és tudatos HR-ről.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | trita",
    description:
      "Cikkek csapatdinamikáról, személyiségpszichológiáról és tudatos HR-ről.",
    url: "/blog",
    type: "website",
    siteName: "trita",
  },
};

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
