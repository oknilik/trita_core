import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";

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
  const sage = ["Bevezetés", "Csapatdinamika", "Önértékelés", "Fluktuáció", "Introduction", "Team dynamics", "Self-assessment", "Turnover"];
  const bronze = ["Change management", "HEXACO", "Toborzás", "Recruitment", "Pszichometria", "Psychometrics"];
  if (sage.includes(tag)) return "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]";
  if (bronze.includes(tag)) return "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]";
  return "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]";
}

export default async function BlogListPage() {
  const locale = await getServerLocale();
  const posts = getAllPosts(locale as "hu" | "en");
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      {/* Hero */}
      <section className="px-5 pb-8 pt-10 lg:px-14 lg:pt-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="h-px w-4 bg-[var(--color-accent-primary)]" />
            <span className="text-[9px] font-medium uppercase tracking-[2px] text-[var(--color-accent-primary)]">
              Blog
            </span>
          </div>
          <h1 className="mb-2 font-fraunces text-[24px] leading-[1.12] tracking-tight text-[var(--color-text-primary)] lg:text-[34px]">
            {t("blog.heroTitle", locale)}
            <em className="not-italic text-[var(--color-accent-primary)]">
              {t("blog.heroTitleEm", locale)}
            </em>
          </h1>
          <p className="max-w-[540px] text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t("blog.heroSub", locale)}
          </p>
        </div>
      </section>

      <section className="px-5 pb-12 lg:px-14">
        <div className="mx-auto max-w-4xl">
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
                  className="group mb-7 grid grid-cols-1 overflow-hidden rounded-xl border-[1.5px] border-[var(--color-border-default)] transition-shadow hover:shadow-lg hover:shadow-black/[0.03] lg:grid-cols-[1fr_1.3fr]"
                >
                  {/* Left: bronze visual with key stat */}
                  <div className="relative flex min-h-[160px] flex-col items-center justify-center bg-gradient-to-br from-[var(--color-accent-primary)] via-[var(--color-accent-primary-mid)] to-[var(--color-accent-primary-strong)] p-8 lg:min-h-[200px]">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-[120px] w-[120px] rounded-full bg-white/[0.04]" />
                    <span className="mb-4 inline-flex rounded-full bg-[var(--color-action-primary-bg)]/30 px-2.5 py-[3px] text-[7px] font-semibold uppercase tracking-[1px] text-[var(--color-text-success-soft)]">
                      {t("blog.featured", locale)}
                    </span>
                    <p className="font-fraunces text-[40px] leading-none text-white/80">
                      {featured.readingTime.replace(/[^\d]/g, "")}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {t("blog.minRead", locale)}
                    </p>
                    {featured.tags[0] && (
                      <p className="mt-3 text-[10px] font-medium uppercase tracking-[1px] text-white/30">
                        {featured.tags[0]}
                      </p>
                    )}
                  </div>
                  {/* Right: content */}
                  <div className="flex flex-col justify-center p-6 lg:p-8">
                    {featured.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {featured.tags.map((tag, i) => (
                          <span
                            key={tag}
                            className={`rounded-full px-2 py-[2.5px] text-[8px] font-medium uppercase tracking-wide ${
                              i === 0 ? "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]" : "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="mb-1.5 font-fraunces text-xl leading-[1.2] text-[var(--color-text-primary)]">
                      {featured.title}
                    </h2>
                    <p className="mb-2.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                      {featured.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
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
                  className="group block border-t border-[var(--color-border-default)] py-[22px] transition-all hover:pl-2"
                >
                  {post.tags.length > 0 && (
                    <div className="mb-[5px] flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full px-[7px] py-[2px] text-[7px] font-medium uppercase tracking-wide ${getTagStyle(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="mb-1 font-fraunces text-lg leading-[1.25] text-[var(--color-text-primary)]">
                    {post.title}
                  </h2>
                  <p className="max-w-[640px] text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                    {post.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {new Date(post.publishedAt).toLocaleDateString(
                        locale === "en" ? "en-GB" : "hu-HU",
                        { year: "numeric", month: "long", day: "numeric" },
                      )}{" "}
                      · {post.readingTime}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--color-action-primary-bg)] opacity-0 transition-opacity group-hover:opacity-100">
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
