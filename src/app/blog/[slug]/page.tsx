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

// ─── Custom MDX Components ────────────────────────────────────────────────────

const DIM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  H: { bg: "#eef2ff", text: "#3730a3", border: "#c7d2fe" },
  E: { bg: "#f5f3ff", text: "#5b21b6", border: "#ddd6fe" },
  X: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  A: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  C: { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
  O: { bg: "#fdf2f8", text: "#86198f", border: "#f5d0fe" },
  N: { bg: "#fff1f2", text: "#9f1239", border: "#fecdd3" },
};

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-7 border-l-[3px] border-sage bg-[#fdf5f0] px-5 py-4 rounded-r-lg">
      <p className="font-fraunces text-[17px] italic leading-[1.7] text-ink-body">{children}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border border-sand bg-white px-6 py-5 text-center">
      <span className="font-fraunces text-4xl font-black text-bronze leading-none">{value}</span>
      <span className="mt-2 text-[13px] leading-[1.55] text-ink-body">{label}</span>
    </div>
  );
}

function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="my-7 flex flex-col gap-3 sm:flex-row">{children}</div>;
}

function DimBadge({ code, label }: { code: string; label: string }) {
  const colors = DIM_COLORS[code] ?? { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
  return (
    <span
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold"
    >
      <span className="font-dm-sans font-bold">{code}</span>
      <span>{label}</span>
    </span>
  );
}

function CompareTable({
  leftLabel,
  rightLabel,
  rows = [],
}: {
  leftLabel: string;
  rightLabel: string;
  rows?: [string, string][];
}) {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-sand">
      <div className="grid grid-cols-2">
        <div className="bg-white px-5 py-3 text-[12px] font-semibold uppercase tracking-[1px] text-ink-body">
          {leftLabel}
        </div>
        <div className="bg-ink px-5 py-3 text-[12px] font-semibold uppercase tracking-[1px] text-cream/60">
          {rightLabel}
        </div>
      </div>
      {rows.map(([left, right], i) => (
        <div key={i} className="grid grid-cols-2 border-t border-sand">
          <div className="bg-white px-5 py-3 text-[14px] text-ink-body">{left}</div>
          <div className="bg-ink px-5 py-3 text-[14px] text-cream/80">{right}</div>
        </div>
      ))}
    </div>
  );
}

function KeyInsight({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 rounded-xl bg-ink px-6 py-5">
      <p className="font-dm-sans mb-2 text-[10px] uppercase tracking-[2px] text-bronze">
        // kulcsgondolat
      </p>
      <p className="text-[15px] leading-[1.75] text-cream/85">{children}</p>
    </div>
  );
}

// ─── Prose overrides ──────────────────────────────────────────────────────────

const components = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="font-fraunces text-3xl text-ink mt-10 mb-4 leading-tight" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-fraunces text-2xl text-ink mt-10 mb-3 leading-tight" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-semibold text-lg text-ink mt-8 mb-2" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-[15px] leading-[1.8] text-ink-body mb-5" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-5 space-y-2 pl-5" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-5 space-y-2 pl-5 list-decimal" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className="relative pl-2 text-[15px] leading-[1.75] text-ink-body before:absolute before:-left-3 before:top-[0.85em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-bronze [ol>&]:before:content-none"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-2 border-sage pl-5 italic text-ink-body"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-ink" {...props} />
  ),
  hr: () => <hr className="my-10 border-sand" />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-bronze underline underline-offset-2 hover:text-bronze-dark" {...props} />
  ),
  Callout,
  StatCard,
  StatRow,
  DimBadge,
  CompareTable,
  KeyInsight,
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
    <main className="min-h-dvh bg-cream">
      {/* Header */}
      <header className="border-b border-sand bg-ink px-6 py-12 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-bronze hover:text-bronze-dark"
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
                  className="font-dm-sans rounded-full border border-cream/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[1px] text-cream/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-fraunces text-3xl leading-tight text-cream lg:text-[42px]">
            {post.title}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-cream/70">
            {post.description}
          </p>
          <div className="mt-5 flex items-center gap-3 text-xs text-cream/40">
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
      <section className="border-t border-sand bg-white px-6 py-12 lg:px-16">
        <div className="mx-auto max-w-3xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-dm-sans text-[10px] uppercase tracking-[2px] text-bronze">
              // próbáld ki
            </p>
            <p className="mt-1 font-fraunces text-xl text-ink">
              {isHu
                ? "Nézd meg saját magad – 14 napos trial, kártyaadat nélkül."
                : "See for yourself – 14-day trial, no credit card."}
            </p>
          </div>
          <Link
            href="/sign-up"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded bg-sage px-6 text-sm font-semibold text-white transition-colors hover:bg-sage-dark"
          >
            {isHu ? "Kipróbálom ingyen →" : "Try for free →"}
          </Link>
        </div>
      </section>
    </main>
  );
}
