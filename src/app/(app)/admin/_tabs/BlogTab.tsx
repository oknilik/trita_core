import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { blogStoreMode, githubConfigured } from "@/lib/blog-store";
import { AdminBlogSection } from "@/app/(app)/admin/_components/AdminBlogSection";

// Blog fül — cikkek listája (piszkozatokkal) + szerkesztő. A tartalom a
// content/blog .mdx fájlokból jön; élesben a lista a legutóbbi deploy
// állapotát mutatja (a git az igazság — ld. blog-store.ts).
export function BlogTab() {
  const metas = [
    ...getAllPosts("hu", { includeDrafts: true }),
    ...getAllPosts("en", { includeDrafts: true }),
  ];

  const posts = metas.map((meta) => {
    const full = getPostBySlug(meta.slug);
    return {
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      locale: meta.locale,
      tags: meta.tags,
      publishedAt: meta.publishedAt,
      translationSlug: full?.translationSlug ?? undefined,
      heroQuote: meta.heroQuote,
      startHere: meta.startHere,
      status: meta.status,
      artSeed: meta.artSeed,
      artMotif: meta.artMotif,
      readingTime: meta.readingTime,
      body: full?.content?.trim() ?? "",
    };
  });

  return (
    <AdminBlogSection
      posts={posts}
      storeMode={blogStoreMode()}
      githubReady={githubConfigured()}
    />
  );
}
