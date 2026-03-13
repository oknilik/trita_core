import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { getServerLocale } from "@/lib/i18n-server";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const huPosts = getAllPosts("hu");
  const enPosts = getAllPosts("en");
  return [...huPosts, ...enPosts].map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const baseUrl = getSiteUrl();

  return {
    title: `${post.title} | trita blog`,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${baseUrl}/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      siteName: "trita",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

const components = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="font-playfair text-3xl text-[#1a1814] mt-10 mb-4 leading-tight" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-playfair text-2xl text-[#1a1814] mt-10 mb-3 leading-tight" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-semibold text-lg text-[#1a1814] mt-8 mb-2" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-[15px] leading-[1.8] text-[#3d3a35] mb-5" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-5 space-y-2 pl-5" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-5 space-y-2 pl-5 list-decimal" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className="relative pl-2 text-[15px] leading-[1.75] text-[#3d3a35] before:absolute before:-left-3 before:top-[0.85em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-[#c8410a] [ol>&]:before:content-none"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-2 border-[#c8410a] pl-5 italic text-[#5a5650]"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-[#1a1814]" {...props} />
  ),
  hr: () => <hr className="my-10 border-[#e8e4dc]" />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-[#c8410a] underline underline-offset-2 hover:text-[#a33408]" {...props} />
  ),
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const isHu = locale !== "en";

  return (
    <main className="min-h-dvh bg-[#faf9f6]">
      {/* Header */}
      <header className="border-b border-[#e8e4dc] bg-[#1a1814] px-6 py-12 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#c8410a] hover:text-[#a8340a]"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 3L5 8l5 5" />
            </svg>
            {isHu ? "Vissza a blogra" : "Back to blog"}
          </Link>

          {post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-ibm-plex-mono rounded-full border border-[#faf9f6]/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[1px] text-[#faf9f6]/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-playfair text-3xl leading-tight text-[#faf9f6] lg:text-[42px]">
            {post.title}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#faf9f6]/70">
            {post.description}
          </p>
          <div className="mt-5 flex items-center gap-3 text-xs text-[#faf9f6]/40">
            <span>
              {new Date(post.publishedAt).toLocaleDateString(
                locale === "en" ? "en-GB" : "hu-HU",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <article className="px-6 py-12 lg:px-16 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <MDXRemote source={post.content} components={components} />
        </div>
      </article>

      {/* CTA */}
      <section className="border-t border-[#e8e4dc] bg-white px-6 py-12 lg:px-16">
        <div className="mx-auto max-w-3xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-ibm-plex-mono text-[10px] uppercase tracking-[2px] text-[#c8410a]">
              // próbáld ki
            </p>
            <p className="mt-1 font-playfair text-xl text-[#1a1814]">
              {isHu
                ? "Nézd meg saját magad – 14 napos trial, kártyaadat nélkül."
                : "See for yourself – 14-day trial, no credit card."}
            </p>
          </div>
          <Link
            href="/sign-up"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded bg-[#c8410a] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#a8340a]"
          >
            {isHu ? "Kipróbálom ingyen →" : "Try for free →"}
          </Link>
        </div>
      </section>
    </main>
  );
}
