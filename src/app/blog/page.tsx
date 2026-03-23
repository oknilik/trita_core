import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n-server";
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

export default async function BlogListPage() {
  const locale = await getServerLocale();
  const posts = getAllPosts(locale as "hu" | "en");
  const isHu = locale !== "en";

  return (
    <main className="min-h-dvh bg-cream">
      {/* Hero */}
      <section className="border-b border-sand bg-ink px-6 py-14 lg:px-16 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="font-dm-sans mb-4 text-[11px] uppercase tracking-[2px] text-bronze">
            // blog
          </p>
          <h1 className="font-fraunces text-4xl leading-tight text-cream lg:text-[52px]">
            {isHu
              ? "Csapatintelligencia.\nPszichológia. Döntések."
              : "Team intelligence.\nPsychology. Decisions."}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.75] text-cream/70">
            {isHu
              ? "Gyakorlati cikkek HR vezetőknek és CEO-knak arról, hogyan láthatóvá tehető a csapatdinamika."
              : "Practical articles for HR leaders and CEOs on making team dynamics visible."}
          </p>
        </div>
      </section>

      {/* Post grid */}
      <section className="px-6 py-12 lg:px-16 lg:py-14">
        <div className="mx-auto max-w-4xl">
          {posts.length === 0 ? (
            <p className="text-sm text-muted">
              {isHu ? "Hamarosan..." : "Coming soon..."}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-sand">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col gap-2 py-8 transition-opacity hover:opacity-80"
                >
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-dm-sans rounded-full border border-sand bg-white px-2.5 py-0.5 text-[10px] uppercase tracking-[1px] text-ink-body"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="font-fraunces text-2xl text-ink transition-colors group-hover:text-bronze">
                    {post.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-ink-body">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString(
                        locale === "en" ? "en-GB" : "hu-HU",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </span>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
