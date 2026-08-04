import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();
  const posts = [...getAllPosts("hu"), ...getAllPosts("en")];

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/try`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/patterns`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Fogalom-magyarázó oldal: a karrier-folyamatból hivatkozunk rá, és
    // önmagában is keresésre való tartalom (RIASEC / Holland-kód).
    { url: `${baseUrl}/holland-kod`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/pilot`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...blogUrls,
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
