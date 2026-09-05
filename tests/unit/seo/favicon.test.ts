import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  APPLE_TOUCH_ICON,
  SEARCH_FAVICON_PATH,
  SITE_ICON_LINKS,
} from "@/lib/seo";

const publicRoot = path.join(process.cwd(), "public");

test("a Google elsődleges faviconja fix, hostszintű URL", async () => {
  assert.equal(SEARCH_FAVICON_PATH, "/favicon.ico");
  assert.equal(SITE_ICON_LINKS[0].url, SEARCH_FAVICON_PATH);
  assert.equal(SITE_ICON_LINKS[0].type, "image/x-icon");
  assert.equal(SEARCH_FAVICON_PATH.includes("?"), false);
  await access(path.join(publicRoot, SEARCH_FAVICON_PATH));
});

test("minden bejelentett PNG ikon négyzetes és a deklarált méretű", async () => {
  const pngIcons = [...SITE_ICON_LINKS.slice(1), APPLE_TOUCH_ICON];

  for (const icon of pngIcons) {
    assert.ok(icon.sizes, `${icon.url}: hiányzó méretdeklaráció`);
    const metadata = await sharp(path.join(publicRoot, icon.url)).metadata();
    const [declaredWidth, declaredHeight] = icon.sizes.split("x").map(Number);

    assert.equal(metadata.format, "png", `${icon.url}: nem PNG`);
    assert.equal(metadata.width, declaredWidth, `${icon.url}: hibás szélesség`);
    assert.equal(metadata.height, declaredHeight, `${icon.url}: hibás magasság`);
    assert.equal(metadata.width, metadata.height, `${icon.url}: nem négyzetes`);
  }
});
