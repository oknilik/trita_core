"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { BlogPost } from "@/lib/blog";
import { BlogArtVisual } from "@/components/blog/BlogArtVisual";

type PostMeta = Omit<BlogPost, "content">;

// Tag color helper
function getTagStyle(tag: string): string {
  const sage = ["bevezetés", "csapatdinamika", "önértékelés", "fluktuáció", "introduction", "team dynamics", "self-assessment", "turnover"];
  const bronze = ["change management", "tritan", "toborzás", "recruitment", "pszichometria", "psychometrics"];
  const key = tag.toLowerCase();
  if (sage.includes(key)) return "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]";
  if (bronze.includes(key)) return "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]";
  return "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]";
}

const NEW_BADGE_DAYS = 30;

function isNew(publishedAt: string): boolean {
  return Date.now() - new Date(publishedAt).getTime() < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === "en" ? "en-GB" : "hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TagRow({ tags, firstAccent = false }: { tags: string[]; firstAccent?: boolean }) {
  if (tags.length === 0) return null;
  return (
    <span className="mb-2 flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <span
          key={tag}
          className={`rounded-full px-2.5 py-0.5 text-micro font-medium uppercase tracking-wide ${
            firstAccent
              ? i === 0
                ? "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]"
                : "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
              : getTagStyle(tag)
          }`}
        >
          {tag}
        </span>
      ))}
    </span>
  );
}

function NewBadge({ locale }: { locale: string }) {
  return (
    <span className="rounded-full bg-[var(--color-accent-primary)] px-2 py-0.5 text-micro font-bold uppercase tracking-wider text-white">
      {t("blog.newBadge", locale as "hu" | "en")}
    </span>
  );
}

// A posztlista mindkét nyelven build-time készül (a page tölti fs-ből);
// a kliens csak a megjelenítendő nyelvet és a téma-szűrőt kezeli.
export function BlogListContent({
  postsByLocale,
}: {
  postsByLocale: { hu: PostMeta[]; en: PostMeta[] };
}) {
  const { locale } = useLocale();
  const posts = postsByLocale[locale === "en" ? "en" : "hu"];
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Téma-chipek: a leggyakoribb tagek darabszámmal (max 5)
  const tagChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) {
      for (const tag of p.tags) {
        const key = tag.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  const filtered = activeTag
    ? posts.filter((p) => p.tags.some((tag) => tag.toLowerCase() === activeTag))
    : posts;

  const featured = activeTag ? null : posts[0];
  const rest = activeTag ? filtered : posts.slice(1);
  const gridPosts = rest.slice(0, 2);
  const rowPosts = rest.slice(2);

  const startHerePosts = useMemo(
    () =>
      posts
        .filter((p) => typeof p.startHere === "number")
        .sort((a, b) => (a.startHere ?? 99) - (b.startHere ?? 99))
        .slice(0, 3),
    [posts],
  );

  const chipClass = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-caption transition-colors ${
      active
        ? "border-[var(--color-action-primary-bg)] bg-[var(--color-action-primary-bg)] text-white"
        : "border-sand bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-surface-self-border)] hover:text-[var(--color-accent-self-deep)]"
    }`;

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      {/* Hero — a landing eyebrow + headline idiómájával */}
      <section className="px-7 pb-6 pt-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-[1.5px] w-5 shrink-0 bg-[var(--color-accent-primary)]" />
            <span className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest text-[var(--color-accent-primary)]">
              Blog
            </span>
          </div>
          <h1
            className="mb-4 font-fraunces text-fluid-title font-medium tracking-tight text-ink"
          >
            {t("blog.heroTitle", locale)}
            <em className="italic text-[var(--color-accent-primary)]">
              {t("blog.heroTitleEm", locale)}
            </em>
          </h1>
          <p className="max-w-[560px] text-[16px] font-light leading-relaxed text-ink-body">
            {t("blog.heroSub", locale)}
          </p>

          {/* Téma-szűrő chipek darabszámmal */}
          {tagChips.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTag(null)} className={chipClass(activeTag === null)}>
                {t("blog.filterAll", locale)}{" "}
                <span className={activeTag === null ? "opacity-70" : "text-[var(--color-text-muted)]"}>
                  {posts.length}
                </span>
              </button>
              {tagChips.map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={chipClass(activeTag === tag)}
                >
                  {tag}{" "}
                  <span className={activeTag === tag ? "opacity-70" : "text-[var(--color-text-muted)]"}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-7 pb-14">
        <div className="mx-auto max-w-5xl">
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("blog.empty", locale)}
            </p>
          ) : (
            <>
              {/* Featured article — generatív vizuál + kulcs-állítás */}
              {featured && (
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group mb-8 grid grid-cols-1 overflow-hidden rounded-2xl border border-sand bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.05] md:grid-cols-[1fr_1.3fr]"
                >
                  {/* Bal: generatív vizuál + kulcs-állítás (a nagy percszám helyett) */}
                  <div className="relative flex min-h-[220px] flex-col justify-end overflow-hidden p-6 md:min-h-[250px]">
                    <div className="absolute inset-0">
                      <BlogArtVisual slug={featured.slug} tags={featured.tags} seed={featured.artSeed} motif={featured.artMotif} variant="featured" />
                    </div>
                    <span className="relative mb-3 inline-flex self-start rounded-full bg-white/10 px-3 py-1 text-micro font-semibold uppercase tracking-widest text-white/70">
                      {t("blog.featured", locale)}
                    </span>
                    <p className="relative font-fraunces text-[21px] font-light italic leading-[1.35] text-white">
                      „{featured.heroQuote ?? featured.description.split(/(?<=[.!?])\s/)[0]}”
                    </p>
                  </div>
                  {/* Jobb: tartalom */}
                  <div className="flex flex-col justify-center p-6 md:p-8">
                    <TagRow tags={featured.tags} firstAccent />
                    <h2 className="mb-2 font-fraunces text-2xl leading-[1.2] tracking-tight text-ink">
                      {featured.title}
                    </h2>
                    <p className="mb-3 text-sm leading-relaxed text-ink-body">
                      {featured.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      {isNew(featured.publishedAt) && <NewBadge locale={locale} />}
                      <span>{formatDate(featured.publishedAt, locale)}</span>
                      <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-border-default)]" />
                      <span>{featured.readingTime}</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* „Kezdd itt" sáv az új olvasónak */}
              {!activeTag && startHerePosts.length >= 2 && (
                <div className="mb-8 rounded-2xl border border-sand bg-[var(--color-surface-muted)] p-5">
                  <div className="mb-3.5 flex items-center gap-2.5">
                    <span className="h-[1.5px] w-4 bg-[var(--color-action-primary-bg)]" />
                    <span className="text-label uppercase tracking-widest text-[var(--color-accent-self-deep)]">
                      {t("blog.startHere", locale)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {startHerePosts.map((post, i) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="flex items-start gap-3 rounded-xl border border-sand bg-white px-4 py-3 transition-colors hover:border-[var(--color-surface-self-border)]"
                      >
                        <span className="text-fluid-title font-fraunces text-[22px] italic leading-none text-[var(--color-accent-primary)]">
                          {i + 1}
                        </span>
                        <span>
                          <span className="block text-caption font-semibold leading-snug text-ink">
                            {post.title}
                          </span>
                          <span className="text-micro text-[var(--color-text-muted)]">
                            {post.readingTime}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 2 vizuális kártya */}
              {gridPosts.length > 0 && (
                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {gridPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group overflow-hidden rounded-2xl border border-sand bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.05]"
                    >
                      <div className="h-[120px] overflow-hidden">
                        <BlogArtVisual slug={post.slug} tags={post.tags} seed={post.artSeed} motif={post.artMotif} variant="card" />
                      </div>
                      <div className="p-5">
                        <TagRow tags={post.tags} />
                        <h3 className="mb-1.5 font-fraunces text-lg leading-tight tracking-tight text-ink">
                          {post.title}
                        </h3>
                        <p className="mb-2.5 text-caption leading-relaxed text-ink-body">
                          {post.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                          {isNew(post.publishedAt) && <NewBadge locale={locale} />}
                          <span>{formatDate(post.publishedAt, locale)}</span>
                          <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-border-default)]" />
                          <span>{post.readingTime}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Editorial sorok mini-vizuállal */}
              {rowPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex items-center gap-5 border-t border-[var(--color-border-default)] py-6 transition-all hover:pl-2"
                >
                  <span className="hidden h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl md:block">
                    <BlogArtVisual slug={post.slug} tags={post.tags} seed={post.artSeed} motif={post.artMotif} variant="mini" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <TagRow tags={post.tags} />
                    <h2 className="mb-1.5 font-fraunces text-xl leading-tight tracking-tight text-ink">
                      {post.title}
                    </h2>
                    <p className="max-w-[640px] text-sm leading-relaxed text-ink-body">
                      {post.description}
                    </p>
                    <span className="mt-2.5 flex items-center gap-3">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDate(post.publishedAt, locale)} · {post.readingTime}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-action-primary-bg)] opacity-0 transition-opacity group-hover:opacity-100">
                        {t("blog.readCta", locale)}
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
