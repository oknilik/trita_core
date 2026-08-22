import {
  BLOG_COVER_ALT,
  BLOG_COVER_CONTENT_TYPE,
  BLOG_COVER_SIZE,
  renderBlogCoverImage,
} from "@/lib/og/blog-cover";

// A rajz a `lib/og/blog-cover.tsx`-ben él, mert a hírlevél is ugyanezt a
// vásznat használja — csak neki STABIL (nem build-hashelt) URL kell, ld. az
// ottani megjegyzést és a `/api/newsletter/cover/[slug]` route-ot.
export const alt = BLOG_COVER_ALT;
export const size = BLOG_COVER_SIZE;
export const contentType = BLOG_COVER_CONTENT_TYPE;

export default async function BlogOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderBlogCoverImage(slug);
}
