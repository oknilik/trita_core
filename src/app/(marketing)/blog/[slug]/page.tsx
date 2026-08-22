import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getAllPosts, extractHeadings, slugifyHeading } from "@/lib/blog";
import { DIMENSION_COLORS } from "@/lib/color-system";
import { HEXACO_DIMENSIONS, type HexacoCode } from "@/lib/hexaco";
import { t } from "@/lib/i18n";
import {
  appendSiteSuffix,
  buildPageMetadata,
  clampMetaDescription,
  getTranslatedLanguageAlternates,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { TranslationRedirect } from "../TranslationRedirect";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ArticleToc } from "@/components/blog/ArticleToc";
import { ShareRow } from "@/components/blog/ShareRow";
import { BlogArtVisual } from "@/components/blog/BlogArtVisual";
import { EditorialBackControl } from "@/components/ui/primitives/EditorialBackHeader";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

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
  if (post.status === "draft" && process.env.NODE_ENV !== "development") return {};

  // A cikkeknek nyelvenként KÜLÖN URL-jük van (slug + translationSlug), így
  // itt — a többi marketing-oldallal ellentétben — valódi reciprok hreflang
  // pár képezhető, x-default-tal a HU változatra.
  const languages = post.translationSlug
    ? getTranslatedLanguageAlternates({
        [post.locale]: `/blog/${slug}`,
        [post.locale === "hu" ? "en" : "hu"]: `/blog/${post.translationSlug}`,
      })
    : undefined;

  return buildPageMetadata({
    path: `/blog/${slug}`,
    title: appendSiteSuffix(post.title, "trita blog"),
    // A frontmatter description a felületen is megjelenik (lead bekezdés),
    // ezért ott hosszabb lehet — a meta-snippetbe mondathatáron vágjuk.
    description: clampMetaDescription(post.description),
    ogTitle: post.title,
    ogDescription: post.description,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.publishedAt,
    locale: post.locale,
    languages,
    // A cikknek SAJÁT `opengraph-image.tsx`-e van ebben a mappában — azt a
    // Next a fájl-konvencióból teszi a fejlécbe. Kézzel is beállítva két
    // og:image kerülne ki, ezért itt kifejezetten nem adunk képet.
    ogImage: null,
  });
}

// ─── Tag color helper ─────────────────────────────────────────────────────────

function getTagStyle(tag: string): string {
  const sage = ["bevezetés", "csapatdinamika", "önértékelés", "fluktuáció", "introduction", "team dynamics", "self-assessment", "turnover"];
  const bronze = ["change management", "hexaco", "toborzás", "recruitment", "pszichometria", "psychometrics"];
  const key = tag.toLowerCase();
  if (sage.includes(key)) return "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]";
  if (bronze.includes(key)) return "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]";
  return "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]";
}

// ─── Custom MDX Components ────────────────────────────────────────────────────

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-7 rounded-r-lg border-l-[3px] border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] px-6 py-5 font-fraunces text-heading italic leading-[1.65] text-[var(--color-accent-self-deep)] [&_p]:mb-0 [&_p:not(:last-child)]:mb-4 [&_p]:text-inherit [&_p]:leading-[1.65]">
      {children}
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-[10px] border border-[var(--color-border-default)] bg-surface-card px-6 py-5 text-center">
      <span className="font-fraunces text-heading leading-none text-[var(--color-action-primary-bg)]">{value}</span>
      <span className="mt-1.5 text-note leading-[1.4] text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}

function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="my-7 grid grid-cols-1 gap-2 sm:grid-cols-3">{children}</div>;
}

// Kanonikus HEXACO-paletta (color-system.ts): chip = strong szöveg soft
// háttéren, base border. A korábbi negyedik (kevert) helyi paletta és a
// hiba-piros N-badge kivezetve — az N (örökség-kód) neutrális.
const DIM_COLORS: Record<string, { bg: string; text: string; border: string }> =
  Object.fromEntries(
    (Object.entries(DIMENSION_COLORS) as [string, { base: string; strong: string; soft: string }][])
      .map(([code, c]) => [code, { bg: c.soft, text: c.strong, border: c.base }]),
  );

// HEXACO-betű → belső dim-kód visszatérkép: a posztok egy része betűvel
// (H/E/X/A/C/O), más része belső kóddal (C/H) hívja a badge-et.
const LETTER_TO_DIM: Record<string, HexacoCode> = Object.fromEntries(
  (Object.entries(HEXACO_DIMENSIONS) as [HexacoCode, { letter: string }][])
    .map(([dimCode, dim]) => [dim.letter, dimCode]),
);

function DimBadge({ code, label }: { code: string; label: string }) {
  // A kódot a kanonikus térképen (tritan.ts) visszük át: belső kód (C/H)
  // → HEXACO-betű, betű → önmaga — az olvasó SOHA nem lát nyers belső kódot.
  // A szín is a felismert dimenzióból jön, így a betűvel hívott badge-ek sem
  // esnek a neutrális fallbackre. Ismeretlen kód (pl. örökség-N) változatlanul,
  // neutrális színnel megy át.
  const dimCode: HexacoCode | undefined =
    code in HEXACO_DIMENSIONS ? (code as HexacoCode) : LETTER_TO_DIM[code];
  const letter = dimCode ? HEXACO_DIMENSIONS[dimCode].letter : code;
  const colors = DIM_COLORS[dimCode ?? code] ?? { bg: "var(--color-surface-subtle)", text: "var(--color-text-secondary)", border: "var(--color-border-default)" };
  return (
    <span
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
    >
      <span className="font-dm-sans font-bold">{letter}</span>
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
  // Mobilon a két hasáb egymás alá kerül, cellánként megismételt
  // oszlopcímkével (a fejléc-sáv csak md:-től látszik) — 320px-en a
  // 2×~92px-es hasábokban a hosszú szakkifejezések olvashatatlanok.
  return (
    <div className="my-8 overflow-hidden rounded-[10px] border border-[var(--color-border-default)]">
      <div className="hidden grid-cols-2 md:grid">
        <div className="bg-surface-card px-5 py-3 text-micro font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {leftLabel}
        </div>
        <div className="bg-[var(--color-surface-inverse)] px-5 py-3 text-micro font-semibold uppercase tracking-wider text-white/60">
          {rightLabel}
        </div>
      </div>
      {rows.map(([left, right], i) => (
        <div key={i} className="grid grid-cols-1 border-t border-[var(--color-border-default)] md:grid-cols-2">
          <div className="bg-surface-card px-4 py-3 text-caption text-[var(--color-text-secondary)] md:px-5">
            <span className="mb-1 block text-micro font-semibold uppercase tracking-wider text-[var(--color-text-muted)] md:hidden">
              {leftLabel}
            </span>
            {left}
          </div>
          <div className="bg-[var(--color-surface-inverse)] px-4 py-3 text-caption text-white/80 md:px-5">
            <span className="mb-1 block text-micro font-semibold uppercase tracking-wider text-white/60 md:hidden">
              {rightLabel}
            </span>
            {right}
          </div>
        </div>
      ))}
    </div>
  );
}

// PullQuote — Fraunces italic idézet bronz vonallal, a szövegritmus
// tördelésére (MDX-ben: <PullQuote source="kulcsgondolat">…</PullQuote>)
function PullQuote({ children, source }: { children: React.ReactNode; source?: string }) {
  return (
    <div className="my-8 border-l-[2.5px] border-[var(--color-accent-primary)] py-1.5 pl-6">
      <p className="font-fraunces text-heading italic leading-[1.45] text-ink">{children}</p>
      {source && (
        <span className="mt-2 block text-label uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {source}
        </span>
      )}
    </div>
  );
}

function KeyInsight({ children, isHu = true }: { children: React.ReactNode; isHu?: boolean }) {
  return (
    <div className="my-8 rounded-[10px] bg-[var(--color-surface-inverse)] px-6 py-5">
      <SectionEyebrow as="div" tone="onDark" className="mb-2">
        {isHu ? "kulcsgondolat" : "key insight"}
      </SectionEyebrow>
      <div className="text-base leading-[1.75] text-white/85">{children}</div>
    </div>
  );
}

// ─── Prose overrides ──────────────────────────────────────────────────────────

const makeComponents = (isHu: boolean) => ({
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-5 mt-14 font-fraunces text-title leading-[1.22] tracking-tight text-ink" {...props} />
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    // A TOC-hoz azonos módon képzett horgony-id (ld. slugifyHeading)
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
          ? children.filter((c) => typeof c === "string").join("")
          : "";
    return (
      <h2
        id={text ? slugifyHeading(text) : undefined}
        className="mb-4 mt-12 scroll-mt-20 font-fraunces text-title leading-[1.22] tracking-tight text-ink"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-3 mt-10 text-xl font-semibold text-[var(--color-text-primary)]" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-6 text-heading leading-[1.8] text-[var(--color-text-secondary)]" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-6 space-y-2 pl-5" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-6 list-decimal space-y-2 pl-5" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className="relative pl-2 text-heading leading-[1.8] text-[var(--color-text-secondary)] before:absolute before:-left-3 before:top-[0.85em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-[var(--color-accent-primary)] [ol>&]:before:content-none"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-8 rounded-r-[10px] border-l-[2.5px] border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] py-4 pl-6 pr-5 italic text-[var(--color-accent-self-deep)] [&_p]:mb-0 [&_p:not(:last-child)]:mb-4 [&_p]:text-inherit"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-[var(--color-text-primary)]" {...props} />
  ),
  hr: () => <hr className="my-10 border-[var(--color-border-default)]" />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-[var(--color-action-primary-bg)] underline underline-offset-2 hover:text-[var(--color-accent-self-deep)]" {...props} />
  ),
  Callout,
  PullQuote,
  StatCard,
  StatRow,
  DimBadge,
  CompareTable,
  KeyInsight: ({ children }: { children: React.ReactNode }) => (
    <KeyInsight isHu={isHu}>{children}</KeyInsight>
  ),
});

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  // Piszkozat élesben nem elérhető (dev-ben igen — ott az előnézet)
  if (post.status === "draft" && process.env.NODE_ENV !== "development") notFound();

  // Statikus oldal: a keret is a cikk nyelvén renderel; nyelvváltásnál a
  // TranslationRedirect kliens-oldalon visz a fordítás-párra.
  const locale = post.locale;

  // Article JSON-LD — a `structured-data.ts` építőjével, hogy az `author` és a
  // `publisher` a landing Organization-entitására MUTASSON (`@id`), ne egy
  // névazonos másolatot hirdessen minden cikk.
  //
  // A per-cikk `opengraph-image.tsx` VALÓS route-ja build-generált utótagot kap
  // (`…/opengraph-image-<hash>`), amit oldalkódból nem lehet kiolvasni — az
  // utótag nélküli `/blog/<slug>/opengraph-image` 404. Ezért a JSON-LD a gyökér
  // `/opengraph-image` route stabil márka-képére mutat (ez az építő
  // alapértelmezése); a cikk-specifikus vizuált a fájl-konvenciós `og:image`
  // meta viszi.
  //
  // `wordCount` + `timeRequired` + `keywords`: az AI-válaszmotorok ezekből
  // becslik a tartalom mélységét és témáját, mielőtt idéznének.
  const articleJsonLd = buildArticleJsonLd({
    path: `/blog/${post.slug}`,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    // A frontmatterben nincs külön `updatedAt`; amíg egy cikket nem
    // szerkesztünk, a módosítás dátuma megegyezik a megjelenéssel. (Ha lesz
    // `updatedAt` mező, ide kell bekötni — ld. src/lib/blog.ts.)
    dateModified: post.publishedAt,
    locale: post.locale,
    keywords: post.tags,
    section: post.tags[0],
    readingMinutes: post.readingMinutes,
    wordCount: post.content.trim().split(/\s+/).length,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: post.locale === "hu" ? "Főoldal" : "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  // Related posts (same tags, excluding current)
  const allPosts = getAllPosts(locale as "hu" | "en");
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 2);

  // Előző/következő cikk (az allPosts dátum szerint csökkenő)
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const newerPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  // TOC a h2-kből (az MDX h2-override azonos slugifyHeading-gel képzi az id-t)
  const headings = extractHeadings(post.content);
  const tocLabels = {
    inThisArticle: t("blog.inThisArticle", locale),
    minutesLeft: t("blog.minutesLeft", locale),
  };

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      <ReadingProgress slug={post.slug} />
      <TranslationRedirect
        postLocale={post.locale}
        translationSlug={post.translationSlug}
      />
      {/* Vissza a cikkjegyzékhez */}
      <div className="mx-auto max-w-[1080px] px-7 pb-0 pt-6">
        <EditorialBackControl
          href="/blog"
          backLabel={t("blog.backToBlog", locale)}
        />
      </div>

      <div className="mx-auto max-w-[1080px] px-7 pb-14 pt-4 md:grid md:grid-cols-[minmax(0,1fr)_250px] md:items-start md:gap-10">
      <article className="min-w-0 max-w-[840px]">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-2.5 py-0.5 text-micro font-medium uppercase tracking-wide ${getTagStyle(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title — a landing headline léptékével */}
        <h1
          className="mb-3 font-fraunces text-fluid-title font-medium tracking-tight text-ink"
        >
          {post.title}
        </h1>

        {/* Description */}
        <p className="mb-4 text-heading font-light leading-relaxed text-ink-body">
          {post.description}
        </p>

        {/* Szerző-blokk + megosztás (E-E-A-T — összhangban az Article JSON-LD-vel) */}
        <div className="mb-8 flex items-center gap-3 border-b border-t border-[var(--color-border-default)] py-3.5">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-action-primary-bg)] font-fraunces text-body text-[var(--color-action-primary-fg)]"
          >
            t
          </span>
          <span className="min-w-0">
            <span className="block text-caption font-semibold text-ink">
              {t("blog.authorTeam", locale)}
            </span>
            <span className="block text-micro text-[var(--color-text-muted)]">
              {new Date(post.publishedAt).toLocaleDateString(
                locale === "en" ? "en-GB" : "hu-HU",
                { year: "numeric", month: "long", day: "numeric" },
              )}{" "}
              · {post.readingTime}
            </span>
          </span>
          <span className="ml-auto">
            <ShareRow
              title={post.title}
              labels={{
                copyLink: t("blog.copyLink", locale),
                copied: t("blog.linkCopied", locale),
                share: t("blog.share", locale),
              }}
            />
          </span>
        </div>

        {/* Cikk-fejléc vizuál. Eddig a cikkoldal teljesen kép nélkül indult,
            pedig itt tölti az olvasó a 4–8 percet, és innen készül a
            képernyőkép, amit megosztanak. Ugyanaz a determinisztikus
            kompozíció, mint a listán (azonos slug + family + concept + lineMode + seed),
            így a kártya és a cikk ugyanazt az arcot mutatja. */}
        <div className="mb-8 h-[150px] overflow-hidden rounded-2xl border border-sand md:h-[190px]">
          <BlogArtVisual
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

        {/* Mobil TOC */}
        <ArticleToc
          variant="mobile"
          headings={headings}
          totalMinutes={post.readingMinutes}
          labels={tocLabels}
        />

        {/* MDX Content — .blog-prose: iniciálé az első bekezdésen */}
        <div className="blog-prose">
          <MDXRemote source={post.content} components={makeComponents(post.locale !== "en")} />
        </div>

        {/* Előző / következő cikk */}
        {(olderPost || newerPost) && (
          <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
            {olderPost ? (
              <Link
                href={`/blog/${olderPost.slug}`}
                className="rounded-xl border border-sand bg-surface-card px-5 py-4 transition-all hover:-translate-y-px hover:border-[var(--color-surface-self-border)]"
              >
                <span className="mb-1.5 block text-label uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                  {t("blog.prevArticle", locale)}
                </span>
                <span className="font-fraunces text-body leading-[1.3] text-ink">
                  {olderPost.title}
                </span>
              </Link>
            ) : (
              <span className="hidden md:block" />
            )}
            {newerPost && (
              <Link
                href={`/blog/${newerPost.slug}`}
                className="rounded-xl border border-sand bg-surface-card px-5 py-4 text-right transition-all hover:-translate-y-px hover:border-[var(--color-surface-self-border)]"
              >
                <span className="mb-1.5 block text-label uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                  {t("blog.nextArticle", locale)}
                </span>
                <span className="font-fraunces text-body leading-[1.3] text-ink">
                  {newerPost.title}
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-10 border-t border-[var(--color-border-default)] pt-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-[1.5px] w-5 shrink-0 bg-[var(--color-accent-primary)]" />
              <span className="font-dm-sans text-label uppercase text-[var(--color-accent-primary-strong)]">
                {t("blog.readNext", locale)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="rounded-2xl border border-sand bg-surface-card p-5 transition-all hover:-translate-y-px hover:shadow-md hover:shadow-black/[0.04]"
                >
                  {rel.tags.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {rel.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-[var(--color-surface-subtle)] px-1.5 py-0.5 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="mb-1 font-fraunces text-body leading-tight text-ink">
                    {rel.title}
                  </h3>
                  <span className="text-micro text-[var(--color-text-muted)]">
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
        <div className="mt-8 flex flex-col items-center gap-5 rounded-2xl bg-gradient-to-br from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] p-7 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
          <div className="flex-1 text-center sm:text-left">
            <p className="mb-1.5 font-dm-sans text-micro font-semibold uppercase tracking-widest text-[var(--color-accent-primary-soft)]">
              {t("blog.tryEyebrow", locale)}
            </p>
            <h3 className="mb-1.5 font-fraunces text-xl leading-snug text-white">
              {t("blog.tryTitle", locale)}
            </h3>
            <p className="text-caption leading-relaxed text-white/[0.45]">
              {t("blog.trySub", locale)}
            </p>
          </div>
          <Link
            href="/try"
            className="shrink-0 rounded-[10px] bg-[var(--color-accent-primary)] px-7 py-3.5 text-sm font-semibold text-[var(--color-text-on-accent)] transition-all hover:-translate-y-px hover:brightness-[1.06]"
          >
            {t("blog.tryCta", locale)}
          </Link>
        </div>

        {/* Feliratkozás — a cikk VÉGÉN, mert itt a legmagasabb a szándék:
            aki idáig eljutott, annak az „szólunk, ha új cikk jön" valódi
            ajánlat, nem megszakítás. */}
        <NewsletterForm source="blog_post" className="mt-6" />
      </article>

      {/* Oldalsáv: sticky TOC + halk mini-CTA */}
      <aside className="hidden md:block">
        <div className="sticky top-6 space-y-4">
          <ArticleToc
            variant="desktop"
            headings={headings}
            totalMinutes={post.readingMinutes}
            labels={tocLabels}
          />
          <div className="rounded-xl border border-[var(--color-surface-self-border)] bg-[var(--color-surface-self-accent-soft)] px-5 py-4">
            <p className="mb-1 text-caption font-semibold text-[var(--color-accent-self-deep)]">
              {t("blog.tryTitle", locale)}
            </p>
            <p className="mb-3 text-micro leading-relaxed text-[var(--color-text-secondary)]">
              {t("blog.trySub", locale)}
            </p>
            <Link
              href="/try"
              className="inline-block rounded-lg bg-[var(--color-action-primary-bg)] px-4 py-2 text-caption font-semibold text-[var(--color-action-primary-fg)] transition-colors hover:bg-[var(--color-action-primary-bg-hover)]"
            >
              {t("blog.tryCta", locale)}
            </Link>
          </div>
        </div>
      </aside>
      </div>
    </main>
  );
}
