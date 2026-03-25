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

// ─── Tag color helper ─────────────────────────────────────────────────────────

function getTagStyle(tag: string): string {
  const sage = ["Bevezetés", "Csapatdinamika", "Önértékelés", "Fluktuáció", "Introduction", "Team dynamics"];
  const bronze = ["Change management", "HEXACO", "Toborzás", "Recruitment"];
  if (sage.includes(tag)) return "bg-[#e8f2f0] text-[#1e3d34]";
  if (bronze.includes(tag)) return "bg-[#fdf5ee] text-[#8a5530]";
  return "bg-[#f2ede6] text-[#8a8a9a]";
}

// ─── Custom MDX Components ────────────────────────────────────────────────────

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-7 rounded-r-lg border-l-[3px] border-[#3d6b5e] bg-[#e8f2f0] px-5 py-4 font-fraunces text-[17px] italic leading-[1.7] text-[#1e3d34]">
      {children}
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-[10px] border border-[#e8e0d3] bg-white px-6 py-5 text-center">
      <span className="font-fraunces text-[22px] leading-none text-[#3d6b5e]">{value}</span>
      <span className="mt-1.5 text-[11px] leading-[1.4] text-[#8a8a9a]">{label}</span>
    </div>
  );
}

function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="my-7 grid grid-cols-1 gap-2 sm:grid-cols-3">{children}</div>;
}

const DIM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  H: { bg: "#e8f2f0", text: "#1e3d34", border: "#3d6b5e" },
  E: { bg: "#f5f3ff", text: "#5b21b6", border: "#ddd6fe" },
  X: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  A: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  C: { bg: "#fdf5ee", text: "#8a5530", border: "#c17f4a" },
  O: { bg: "#fdf2f8", text: "#86198f", border: "#f5d0fe" },
  N: { bg: "#fff1f2", text: "#9f1239", border: "#fecdd3" },
};

function DimBadge({ code, label }: { code: string; label: string }) {
  const colors = DIM_COLORS[code] ?? { bg: "#f2ede6", text: "#4a4a5e", border: "#e8e0d3" };
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
    <div className="my-8 overflow-hidden rounded-[10px] border border-[#e8e0d3]">
      <div className="grid grid-cols-2">
        <div className="bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.5px] text-[#4a4a5e]">
          {leftLabel}
        </div>
        <div className="bg-[#1a1a2e] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.5px] text-white/60">
          {rightLabel}
        </div>
      </div>
      {rows.map(([left, right], i) => (
        <div key={i} className="grid grid-cols-2 border-t border-[#e8e0d3]">
          <div className="bg-white px-5 py-3 text-[13px] text-[#4a4a5e]">{left}</div>
          <div className="bg-[#1a1a2e] px-5 py-3 text-[13px] text-white/80">{right}</div>
        </div>
      ))}
    </div>
  );
}

function KeyInsight({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 rounded-[10px] bg-[#1a1a2e] px-6 py-5">
      <div className="font-dm-sans mb-2 text-[8px] uppercase tracking-[1.5px] text-[#e8a96a]">
        {"//"} kulcsgondolat
      </div>
      <div className="text-[15px] leading-[1.75] text-white/85">{children}</div>
    </div>
  );
}

// ─── Prose overrides ──────────────────────────────────────────────────────────

const components = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-5 mt-14 font-fraunces text-[24px] leading-[1.3] text-[#1a1a2e]" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-4 mt-12 font-fraunces text-[20px] leading-[1.3] text-[#1a1a2e]" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-3 mt-10 text-lg font-semibold text-[#1a1a2e]" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-6 text-[15px] leading-[1.85] text-[#4a4a5e]" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-6 space-y-2 pl-5" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-6 list-decimal space-y-2 pl-5" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className="relative pl-2 text-[15px] leading-[1.85] text-[#4a4a5e] before:absolute before:-left-3 before:top-[0.85em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-[#c17f4a] [ol>&]:before:content-none"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-8 rounded-r-[10px] border-l-[2.5px] border-[#3d6b5e] bg-[#e8f2f0] py-4 pl-6 pr-5 italic text-[#1e3d34]"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-[#1a1a2e]" {...props} />
  ),
  hr: () => <hr className="my-10 border-[#e8e0d3]" />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-[#3d6b5e] underline underline-offset-2 hover:text-[#1e3d34]" {...props} />
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

  // Related posts (same tags, excluding current)
  const allPosts = getAllPosts(locale as "hu" | "en");
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 2);

  return (
    <main className="min-h-dvh bg-[#f7f4ef]">
      {/* Header */}
      <div className="mx-auto max-w-[720px] px-5 pb-0 pt-5 lg:px-14">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-xs text-[#3d6b5e] hover:text-[#1e3d34]"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {isHu ? "Vissza a blogra" : "Back to blog"}
        </Link>
      </div>

      <article className="mx-auto max-w-[720px] px-5 pb-12 pt-3 lg:px-14">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-2 py-[2.5px] text-[8px] font-medium uppercase tracking-wide ${getTagStyle(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="mb-2 font-fraunces text-[26px] leading-[1.18] tracking-tight text-[#1a1a2e] lg:text-[30px]">
          {post.title}
        </h1>

        {/* Description */}
        <p className="mb-2.5 text-sm leading-relaxed text-[#8a8a9a]">
          {post.description}
        </p>

        {/* Meta */}
        <div className="mb-8 flex items-center gap-2 border-b border-[#e8e0d3] pb-4 text-[11px] text-[#8a8a9a]">
          <span>
            {new Date(post.publishedAt).toLocaleDateString(
              locale === "en" ? "en-GB" : "hu-HU",
              { year: "numeric", month: "long", day: "numeric" },
            )}
          </span>
          <span className="h-[3px] w-[3px] rounded-full bg-[#e8e0d3]" />
          <span>{post.readingTime}</span>
        </div>

        {/* MDX Content */}
        <MDXRemote source={post.content} components={components} />

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-8 border-t border-[#e8e0d3] pt-6">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[1.5px] text-[#8a8a9a]">
              {isHu ? "Ezt olvasd tovább" : "Read next"}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="rounded-[10px] border border-[#e8e0d3] bg-white p-4 transition-all hover:-translate-y-px hover:shadow-md hover:shadow-black/[0.03]"
                >
                  {rel.tags.length > 0 && (
                    <div className="mb-1 flex flex-wrap gap-[3px]">
                      {rel.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-[#f2ede6] px-[5px] py-px text-[6px] uppercase tracking-wide text-[#8a8a9a]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="mb-[3px] font-fraunces text-sm leading-[1.2] text-[#1a1a2e]">
                    {rel.title}
                  </h3>
                  <span className="text-[9px] text-[#8a8a9a]">
                    {new Date(rel.publishedAt).toLocaleDateString(
                      locale === "en" ? "en-GB" : "hu-HU",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}{" "}
                    · {rel.readingTime}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA block */}
        <div className="mt-7 flex flex-col items-center gap-5 rounded-[14px] bg-gradient-to-br from-[#1a1a2e] to-[#2a2740] p-7 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
          <div className="flex-1 text-center sm:text-left">
            <p className="mb-1 text-[8px] uppercase tracking-[1.5px] text-[#e8a96a]">
              {isHu ? "Próbáld ki" : "Try it"}
            </p>
            <h3 className="mb-1 font-fraunces text-lg leading-snug text-white">
              {isHu ? "Nézd meg, milyen eredményt kapsz." : "See what your results look like."}
            </h3>
            <p className="text-xs leading-relaxed text-white/[0.35]">
              {isHu
                ? "~15 perc, és megkapod az első karrierképedet — ingyenesen."
                : "~15 minutes to your first career profile — for free."}
            </p>
          </div>
          <Link
            href="/try"
            className="shrink-0 rounded-[10px] bg-[#c17f4a] px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-[1.06]"
          >
            {isHu ? "Teszt indítása →" : "Start assessment →"}
          </Link>
        </div>
      </article>
    </main>
  );
}
