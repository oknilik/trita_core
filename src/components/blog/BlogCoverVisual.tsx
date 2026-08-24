import Image from "next/image";
import { BlogArtVisual } from "@/components/blog/BlogArtVisual";
import type { BlogArtConcept, BlogArtFamily, BlogArtLineMode, LegacyBlogArtMotif } from "@/lib/blog-art";

/**
 * A cikk borítója — EGY belépő minden felületnek.
 *
 * Ha a cikkhez van feltöltött kép (`coverImage`), az megy ki; enélkül a
 * generatív vizuál rajzolódik. A hívóknak (lista, cikk-fejléc) így nem kell
 * tudniuk, melyik eset áll fenn — és nem csúszhat el a kettő egymástól.
 *
 * A kép DEKORATÍV: a cím közvetlenül mellette áll minden hívóhelyen, tehát
 * az üres alt a helyes — a felolvasó ne mondja el kétszer ugyanazt.
 */
export function BlogCoverVisual({
  coverImage,
  slug,
  title,
  tags,
  seed,
  motif,
  family,
  concept,
  lineMode,
  variant = "card",
  className,
  priority,
}: {
  coverImage?: string;
  slug: string;
  title?: string;
  tags?: string[];
  seed?: number;
  motif?: LegacyBlogArtMotif;
  family?: BlogArtFamily;
  concept?: BlogArtConcept;
  lineMode?: BlogArtLineMode;
  variant?: "featured" | "card" | "mini";
  className?: string;
  /** A hajtás feletti cikk-fejlécen érdemes — a listán nem. */
  priority?: boolean;
}) {
  if (coverImage) {
    return (
      <Image
        src={coverImage}
        alt=""
        fill
        priority={priority}
        sizes={variant === "mini" ? "160px" : "(min-width: 768px) 720px, 100vw"}
        className={`object-cover ${className ?? ""}`}
      />
    );
  }

  return (
    <BlogArtVisual
      slug={slug}
      title={title}
      tags={tags}
      seed={seed}
      motif={motif}
      family={family}
      concept={concept}
      lineMode={lineMode}
      variant={variant}
      className={className}
    />
  );
}
