import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { ImageResponse } from "next/og";
import { BlogArtVisual } from "@/components/blog/BlogArtVisual";
import { BLOG_ART_FAMILIES } from "@/lib/blog-art";
import { COLORS } from "@/lib/design-tokens";
import type { ArtPalette } from "@/lib/miro-primitives";

const palette: ArtPalette = {
  line: COLORS.ink,
  form: COLORS.bronze,
  sun: COLORS.bronzeSoft,
  counterweight: COLORS.sage,
};

test("mindhárom család valódi, eltérő PNG-vé raszterizálható", async () => {
  const hashes = new Set<string>();

  for (const family of BLOG_ART_FAMILIES) {
    const image = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: COLORS.cream,
          }}
        >
          <BlogArtVisual
            slug={`og-${family}`}
            family={family}
            concept="connection"
            seed={712}
            variant="card"
            palette={palette}
            background={COLORS.warm}
          />
        </div>
      ),
      { width: 400, height: 120 },
    );
    const png = Buffer.from(await image.arrayBuffer());

    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.ok(png.length > 1_000, `${family}: túl kicsi vagy üres PNG`);
    hashes.add(createHash("sha256").update(png).digest("hex"));
  }

  assert.equal(hashes.size, BLOG_ART_FAMILIES.length);
});
