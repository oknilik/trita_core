"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { DEFAULT_LOCALE, t, type Locale } from "@/lib/i18n/public";
import type { BlogPost } from "@/lib/blog";
import { BlogCoverVisual } from "@/components/blog/BlogCoverVisual";
import {
  BLOG_TOPIC_QUERY_KEY,
  resolveBlogTopic,
  toBlogTopicParam,
} from "@/lib/blog-filter";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { ChevronRightIcon } from "@/components/ui/icons";

type PostMeta = Omit<BlogPost, "content">;

// Tag color helper
function getTagStyle(tag: string): string {
  const sage = ["bevezetés", "csapatdinamika", "önértékelés", "fluktuáció", "introduction", "team dynamics", "self-assessment", "turnover"];
  const bronze = ["change management", "hexaco", "toborzás", "recruitment", "pszichometria", "psychometrics"];
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

function TagRow({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <span className="mb-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-full px-2.5 py-0.5 text-micro font-medium uppercase tracking-wide ${getTagStyle(tag)}`}
        >
          {tag}
        </span>
      ))}
    </span>
  );
}

function NewBadge({ locale }: { locale: string }) {
  return (
    <span className="rounded-full bg-[var(--color-accent-primary)] px-2 py-0.5 text-micro font-bold uppercase tracking-wider text-[var(--color-text-on-accent)]">
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
  // Hydration-stabil nyelvválasztás: az SSR-HTML mindig a default nyelvvel
  // készül (statikus oldal), a LocaleProvider viszont már hydration KÖZBEN
  // átválthat (localStorage-effekt) — ha a lista-részfa később hydrálódik,
  // a szerver-HTML és a kliens-render széttart (hydration mismatch a
  // generatív SVG-kben). Ezért az első renderben mindig a defaultot
  // mutatjuk, és csak mount UTÁN váltunk a tényleges nyelvre.
  const [displayLocale, setDisplayLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    setDisplayLocale(locale);
  }, [locale]);
  const posts = postsByLocale[displayLocale === "en" ? "en" : "hu"];
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

  const availableTags = useMemo(
    () => tagChips.map(({ tag }) => tag),
    [tagChips],
  );

  // A szűrő megosztható URL-állapot. A szerver-HTML továbbra is a teljes
  // magyar listával készül; mount után olvassuk az URL-t, de csak akkor,
  // amikor a tényleges locale már beállt. Így egy angol mélylinket nem töröl
  // ki a hydration első, még magyar renderje.
  useEffect(() => {
    if (displayLocale !== locale) return;

    const syncFromUrl = () => {
      const url = new URL(window.location.href);
      const param = url.searchParams.get(BLOG_TOPIC_QUERY_KEY);
      const resolved = resolveBlogTopic(param, availableTags);
      setActiveTag(resolved);

      // Ismeretlen/régi téma-paraméter ne hagyjon hazug, üres szűrőállapotot
      // az URL-ben. Replace: a hibás állapot ne kapjon külön history-lépést.
      if (param && !resolved) {
        url.searchParams.delete(BLOG_TOPIC_QUERY_KEY);
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [availableTags, displayLocale, locale]);

  const filtered = activeTag
    ? posts.filter((p) => p.tags.some((tag) => tag.toLowerCase() === activeTag))
    : posts;

  const heroPost = posts[0];
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
    `inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-caption transition-colors ${FOCUS_RING_CLASS} ${
      active
        ? "border-[var(--color-accent-primary-strong)] bg-[var(--color-accent-primary-strong)] text-white"
        : "border-sand bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary-strong)]"
    }`;

  const setTopic = (tag: string | null) => {
    setActiveTag(tag);
    const url = new URL(window.location.href);
    if (tag) {
      url.searchParams.set(BLOG_TOPIC_QUERY_KEY, toBlogTopicParam(tag));
    } else {
      url.searchParams.delete(BLOG_TOPIC_QUERY_KEY);
    }
    window.history.pushState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  const resultNoun =
    displayLocale === "hu"
      ? t("blog.resultMany", displayLocale)
      : filtered.length === 1
        ? t("blog.resultOne", displayLocale)
        : t("blog.resultMany", displayLocale);

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      {/* Az első szekció az oldal alapszínén marad, így a semleges headerből
          nincs kemény színváltás. A meleg editorial tónus csak belső fény. */}
      <section className="relative overflow-hidden bg-cream px-7 pb-10 pt-10 md:pb-14 md:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[7%] top-[12%] h-[72%] w-[48%] rounded-full bg-[var(--color-surface-highlight-warm)]/35 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-9 md:grid-cols-[1.02fr_0.98fr] md:gap-12 lg:gap-16">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-7 shrink-0 bg-[var(--color-accent-primary-strong)]" />
              <span className="font-dm-sans text-label uppercase tracking-[0.15em] text-[var(--color-accent-primary-strong)]">
                {t("blog.editorialEyebrow", displayLocale)}
              </span>
            </div>
            <h1 className="max-w-[720px] font-fraunces text-fluid-display font-medium leading-[0.98] tracking-[-0.045em] text-ink">
              {t("blog.heroTitle", displayLocale)}
              <em className="italic text-[var(--color-accent-primary-strong)]">
                {t("blog.heroTitleEm", displayLocale)}
              </em>
            </h1>
            <p className="mt-6 max-w-[580px] text-base font-light leading-relaxed text-ink-body md:text-lg">
              {t("blog.heroSub", displayLocale)}
            </p>
          </div>

          {heroPost ? (
            <Link
              href={`/blog/${heroPost.slug}`}
              className={`group relative aspect-[16/10] overflow-hidden rounded-[28px] shadow-[0_22px_54px_rgba(75,44,52,0.16)] ${FOCUS_RING_CLASS}`}
            >
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.025]">
                <BlogCoverVisual
                  coverImage={heroPost.coverImage}
                  coverFocalX={heroPost.coverFocalX}
                  coverFocalY={heroPost.coverFocalY}
                  slug={heroPost.slug}
                  title={heroPost.title}
                  tags={heroPost.tags}
                  seed={heroPost.artSeed}
                  motif={heroPost.artMotif}
                  family={heroPost.artFamily}
                  concept={heroPost.artConcept}
                  lineMode={heroPost.artLineMode}
                  variant="featured"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                <span className="mb-2 block text-micro font-bold uppercase tracking-[0.16em] text-white/75">
                  {t("blog.featured", displayLocale)} · {heroPost.readingTime}
                </span>
                <h2 className="max-w-[420px] font-fraunces text-fluid-heading font-normal leading-[1.08] tracking-tight">
                  {heroPost.title}
                </h2>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      {/* A szűrő ugyanazon a vásznon folytatódik; csak egy halk, tartalmi
          szélességű vonal jelzi a következő ritmusegységet. */}
      {tagChips.length > 1 && (
        <section className="bg-cream px-7">
          <fieldset className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 border-b border-sand/60 py-5">
            <legend className="sr-only">{t("blog.filterLabel", displayLocale)}</legend>
            <span className="mr-2 text-label uppercase tracking-[0.13em] text-[var(--color-text-muted)]" aria-hidden="true">
              {t("blog.filterLabel", displayLocale)}
            </span>
            <button
              type="button"
              aria-pressed={activeTag === null}
              aria-controls="blog-results"
              onClick={() => setTopic(null)}
              className={chipClass(activeTag === null)}
            >
              {t("blog.filterAll", displayLocale)}
              <span className={activeTag === null ? "opacity-70" : "text-[var(--color-text-muted)]"}>
                {posts.length}
              </span>
            </button>
            {tagChips.map(({ tag, count }) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  aria-controls="blog-results"
                  onClick={() => setTopic(active ? null : tag)}
                  className={chipClass(active)}
                >
                  {tag}
                  <span className={active ? "opacity-70" : "text-[var(--color-text-muted)]"}>
                    {count}
                  </span>
                </button>
              );
            })}
          </fieldset>
        </section>
      )}

      <section id="blog-results" className="px-7 pb-20 pt-14 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex min-h-11 flex-wrap items-end justify-between gap-3">
            <div>
              {!activeTag ? (
                <h2 className="mb-2 font-fraunces text-fluid-heading font-normal tracking-tight text-ink">
                  {t("blog.startHere", displayLocale)}
                </h2>
              ) : null}
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="text-caption text-[var(--color-text-muted)]"
            >
              <span className="font-semibold text-[var(--color-text-primary)]">
                {filtered.length} {resultNoun}
              </span>
              {activeTag ? <> · {activeTag}</> : null}
            </p>
            </div>
            {activeTag ? (
              <button
                type="button"
                onClick={() => setTopic(null)}
                className={`inline-flex min-h-10 items-center rounded-lg px-1 text-caption font-semibold text-[var(--color-action-primary-bg)] transition-colors hover:text-[var(--color-accent-self-deep)] ${FOCUS_RING_CLASS}`}
              >
                {t("blog.clearFilter", displayLocale)}
              </button>
            ) : null}
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("blog.empty", displayLocale)}
            </p>
          ) : (
            <>
              {/* „Kezdd itt" sáv az új olvasónak */}
              {!activeTag && startHerePosts.length >= 2 && (
                <div className="mb-10 rounded-[26px] border border-sand bg-[var(--color-surface-muted)] p-5 md:p-6">
                  <div className="mb-3.5 flex items-center gap-2.5">
                    <span className="h-px w-5 bg-[var(--color-accent-primary)]" />
                    <span className="text-label uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                      {t("blog.selectedReads", displayLocale)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {startHerePosts.map((post, i) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className={`group flex items-start gap-3 rounded-2xl border border-sand bg-surface-card px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[var(--color-accent-primary)] ${FOCUS_RING_CLASS}`}
                      >
                        <span className="text-fluid-title font-fraunces text-heading italic leading-none text-[var(--color-accent-primary)]">
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
                <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                  {gridPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className={`group overflow-hidden rounded-[24px] border border-sand bg-surface-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.05] ${FOCUS_RING_CLASS}`}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <BlogCoverVisual
                          coverImage={post.coverImage}
                          coverFocalX={post.coverFocalX}
                          coverFocalY={post.coverFocalY}
                          slug={post.slug}
                          title={post.title}
                          tags={post.tags}
                          seed={post.artSeed}
                          motif={post.artMotif}
                          family={post.artFamily}
                          concept={post.artConcept}
                          lineMode={post.artLineMode}
                          variant="card"
                        />
                      </div>
                      <div className="p-6">
                        <TagRow tags={post.tags} />
                        <h3 className="mb-2 font-fraunces text-2xl font-normal leading-tight tracking-tight text-ink">
                          {post.title}
                        </h3>
                        <p className="mb-2.5 text-caption leading-relaxed text-ink-body">
                          {post.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                          {isNew(post.publishedAt) && <NewBadge locale={displayLocale} />}
                          <span>{formatDate(post.publishedAt, displayLocale)}</span>
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
                  className={`group flex items-center gap-5 border-t border-[var(--color-border-default)] py-7 transition-all hover:pl-2 ${FOCUS_RING_CLASS}`}
                >
                  <span className="relative hidden h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl md:block">
                    <BlogCoverVisual
                      coverImage={post.coverImage}
                      coverFocalX={post.coverFocalX}
                      coverFocalY={post.coverFocalY}
                      slug={post.slug}
                      title={post.title}
                      tags={post.tags}
                      seed={post.artSeed}
                      motif={post.artMotif}
                      family={post.artFamily}
                      concept={post.artConcept}
                      lineMode={post.artLineMode}
                      variant="mini"
                    />
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
                        {formatDate(post.publishedAt, displayLocale)} · {post.readingTime}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-action-primary-bg)] opacity-0 transition-opacity group-hover:opacity-100">
                        {t("blog.readCta", displayLocale)}
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </>
          )}

          {/* Feliratkozás a lista alján — aki végigpörgette a listát, de nem
              nyitott meg cikket, itt még megfogható. */}
          <div className="mt-16 rounded-[28px] bg-[var(--color-surface-inverse)] p-2 md:p-3">
            <NewsletterForm source="blog_index" onInverse className="rounded-[22px] md:p-8" />
          </div>
        </div>
      </section>
    </main>
  );
}
