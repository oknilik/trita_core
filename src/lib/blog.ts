import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  locale: "hu" | "en";
  tags: string[];
  readingTime: string;
  content: string;
}

export function getAllPosts(locale: "hu" | "en" = "hu"): Omit<BlogPost, "content">[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
      const { data, content } = matter(raw);

      if (data.locale && data.locale !== locale) return null;

      const rt = readingTime(content);
      const minutes = Math.ceil(rt.minutes);

      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        publishedAt: data.publishedAt as string,
        locale: (data.locale ?? "hu") as "hu" | "en",
        tags: (data.tags ?? []) as string[],
        readingTime: locale === "hu" ? `${minutes} perc` : `${minutes} min read`,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.publishedAt).getTime() - new Date(a!.publishedAt).getTime()
    ) as Omit<BlogPost, "content">[];
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const rt = readingTime(content);
  const minutes = Math.ceil(rt.minutes);
  const locale = (data.locale ?? "hu") as "hu" | "en";

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    publishedAt: data.publishedAt as string,
    locale,
    tags: (data.tags ?? []) as string[],
    readingTime: locale === "hu" ? `${minutes} perc` : `${minutes} min read`,
    content,
  };
}
