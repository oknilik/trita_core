import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { blogStoreMode, githubConfigured } from "@/lib/blog-store";
import { AdminBlogSection } from "@/app/(app)/admin/_components/AdminBlogSection";
import { AdminNewsletterSection } from "@/app/(app)/admin/_components/AdminNewsletterSection";
import { getDeliveryEngagement, getNewsletterStats } from "@/lib/newsletter";
import { AdminNewsletterIssueSection } from "@/app/(app)/admin/_components/AdminNewsletterIssueSection";
import { prisma } from "@/lib/prisma";
import { DIGEST_LOOKBACK_DAYS } from "@/lib/newsletter-digest";

// Blog fül — cikkek listája (piszkozatokkal) + szerkesztő. A tartalom a
// content/blog .mdx fájlokból jön; élesben a lista a legutóbbi deploy
// állapotát mutatja (a git az igazság — ld. blog-store.ts).
export async function BlogTab() {
  const metas = [
    ...getAllPosts("hu", { includeDrafts: true }),
    ...getAllPosts("en", { includeDrafts: true }),
  ];

  const posts = metas.map((meta) => {
    const full = getPostBySlug(meta.slug);
    return {
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      locale: meta.locale,
      tags: meta.tags,
      publishedAt: meta.publishedAt,
      translationSlug: full?.translationSlug ?? undefined,
      heroQuote: meta.heroQuote,
      startHere: meta.startHere,
      status: meta.status,
      artSeed: meta.artSeed,
      artMotif: meta.artMotif,
      readingTime: meta.readingTime,
      body: full?.content?.trim() ?? "",
    };
  });

  // A hírlevél-blokk a Blog fül tetején él: ugyanaz a munkamenet („megjelent
  // egy cikk"), nem érdemes külön fülre szórni.
  const [stats, engagement, issues, databaseClock] = await Promise.all([
    getNewsletterStats(),
    getDeliveryEngagement(),
    prisma.newsletterIssue.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() AS now`,
  ]);
  const publishedPosts = posts
    .filter((p) => p.status === "published")
    .map((p) => ({ slug: p.slug, title: p.title, locale: p.locale }));
  const digestCutoff = databaseClock[0]!.now.getTime()
    - DIGEST_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const digestPosts = posts
    .filter((post) =>
      post.status === "published"
      && new Date(`${post.publishedAt}T23:59:59.999Z`).getTime() >= digestCutoff,
    )
    .map((post) => ({ slug: post.slug, title: post.title, locale: post.locale }));

  return (
    <>
      <AdminNewsletterSection stats={stats} posts={digestPosts} engagement={engagement} />
      <AdminNewsletterIssueSection
        issues={issues.map((issue) => ({
          id: issue.id,
          locale: issue.locale as "hu" | "en",
          subject: issue.subject,
          intro: issue.intro,
          postSlugs: issue.postSlugs,
          status: issue.status as "DRAFT" | "READY" | "SENDING" | "PARTIAL" | "SENT" | "FAILED",
          sentAt: issue.sentAt?.toISOString() ?? null,
          recipients: issue.recipients,
          failures: issue.failures,
          createdAt: issue.createdAt.toISOString(),
        }))}
        posts={publishedPosts}
      />
      <AdminBlogSection
        posts={posts}
        storeMode={blogStoreMode()}
        githubReady={githubConfigured()}
      />
    </>
  );
}
