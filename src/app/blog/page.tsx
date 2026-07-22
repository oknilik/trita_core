import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { getAllPosts } from "@/lib/blog";

export async function generateMetadata(): Promise<Metadata> {
  return {
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
}

// Tag color helper
function getTagStyle(tag: string): string {
  const sage = ["bevezetés", "csapatdinamika", "önértékelés", "fluktuáció", "introduction", "team dynamics", "self-assessment", "turnover"];
  const bronze = ["change management", "tritan", "toborzás", "recruitment", "pszichometria", "psychometrics"];
  const key = tag.toLowerCase();
  if (sage.includes(key)) return "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]";
  if (bronze.includes(key)) return "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]";
  return "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]";
}

export default async function BlogListPage() {
  const locale = await getServerLocale();
  const posts = getAllPosts(locale as "hu" | "en");
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      {/* Hero — a landing eyebrow + headline idiómájával */}
      <section className="px-7 pb-8 pt-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-[1.5px] w-5 shrink-0 bg-[var(--color-accent-primary)]" />
            <span className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest text-[var(--color-accent-primary)]">
              Blog
            </span>
          </div>
          <h1
            className="mb-4 font-fraunces font-normal tracking-tight text-ink"
            style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.1 }}
          >
            {t("blog.heroTitle", locale)}
            <em className="not-italic italic text-[var(--color-accent-primary)]">
              {t("blog.heroTitleEm", locale)}
            </em>
          </h1>
          <p className="max-w-[560px] text-[16px] font-light leading-relaxed text-ink-body">
            {t("blog.heroSub", locale)}
          </p>
        </div>
      </section>

      <section className="px-7 pb-14">
        <div className="mx-auto max-w-5xl">
          {posts.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("blog.empty", locale)}
            </p>
          ) : (
            <>
              {/* Featured article */}
              {featured && (
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group mb-8 grid grid-cols-1 overflow-hidden rounded-2xl border border-sand bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/[0.05] lg:grid-cols-[1fr_1.3fr]"
                >
                  {/* Left: bronze visual with key stat */}
                  <div className="relative flex min-h-[180px] flex-col items-center justify-center bg-gradient-to-br from-[var(--color-accent-primary)] via-[var(--color-accent-primary-mid)] to-[var(--color-accent-primary-strong)] p-8 lg:min-h-[220px]">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-[120px] w-[120px] rounded-full bg-white/[0.04]" />
                    <span className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/70">
                      {t("blog.featured", locale)}
                    </span>
                    <p className="font-fraunces text-5xl leading-none text-white/85">
                      {featured.readingTime.replace(/[^\d]/g, "")}
                    </p>
                    <p className="mt-1.5 text-xs text-white/45">
                      {t("blog.minRead", locale)}
                    </p>
                    {featured.tags[0] && (
                      <p className="mt-3 font-dm-sans text-[10px] font-medium uppercase tracking-widest text-white/35">
                        {featured.tags[0]}
                      </p>
                    )}
                  </div>
                  {/* Right: content */}
                  <div className="flex flex-col justify-center p-6 lg:p-8">
                    {featured.tags.length > 0 && (
                      <div className="mb-2.5 flex flex-wrap gap-1.5">
                        {featured.tags.map((tag, i) => (
                          <span
                            key={tag}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                              i === 0 ? "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]" : "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="mb-2 font-fraunces text-2xl leading-[1.2] tracking-tight text-ink">
                      {featured.title}
                    </h2>
                    <p className="mb-3 text-sm leading-relaxed text-ink-body">
                      {featured.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <span>
                        {new Date(featured.publishedAt).toLocaleDateString(
                          locale === "en" ? "en-GB" : "hu-HU",
                          { year: "numeric", month: "long", day: "numeric" },
                        )}
                      </span>
                      <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-border-default)]" />
                      <span>{featured.readingTime}</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Editorial list */}
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block border-t border-[var(--color-border-default)] py-6 transition-all hover:pl-2"
                >
                  {post.tags.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getTagStyle(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="mb-1.5 font-fraunces text-xl leading-[1.25] tracking-tight text-ink">
                    {post.title}
                  </h2>
                  <p className="max-w-[640px] text-sm leading-relaxed text-ink-body">
                    {post.description}
                  </p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(post.publishedAt).toLocaleDateString(
                        locale === "en" ? "en-GB" : "hu-HU",
                        { year: "numeric", month: "long", day: "numeric" },
                      )}{" "}
                      · {post.readingTime}
                    </span>
                    <span className="text-xs font-medium text-[var(--color-action-primary-bg)] opacity-0 transition-opacity group-hover:opacity-100">
                      {t("blog.readCta", locale)}
                    </span>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
