import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  BLOG_CONFLICT,
  BLOG_STORE_READ_ONLY,
  blogStoreBranch,
  readBlogRevision,
  saveBlogSource,
} from "@/lib/blog-store";

// A szerkesztő a tároló sha-jával tölt, és azzal is ment. Ha a tároló
// időközben megváltozott (jellemzően: egy korábbi mentés commitja, aminek a
// deployja még nem futott le), a mentés NEM írhatja némán felül a friss
// tartalmat — ez korábban észrevétlen adatvesztés volt.

const ORIGINAL_ENV = { ...process.env };

interface FetchCall {
  url: string;
  method: string;
  body: Record<string, unknown> | null;
}

let calls: FetchCall[] = [];

function stubGithub(remote: { content: string; sha: string } | null): void {
  calls = [];
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({
      url,
      method,
      body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null,
    });

    if (method === "GET") {
      if (!remote) return new Response("", { status: 404 });
      return Response.json({
        content: Buffer.from(remote.content, "utf-8").toString("base64"),
        sha: remote.sha,
      });
    }
    return Response.json({
      commit: { html_url: "https://github.com/o/r/commit/abc" },
      content: { sha: "sha-after-write" },
    });
  }) as typeof fetch;
}

beforeEach(() => {
  delete process.env.GITHUB_BRANCH;
  delete process.env.VERCEL;
  delete process.env.VERCEL_GIT_COMMIT_REF;
  process.env.BLOG_STORE = "github";
  process.env.GITHUB_TOKEN = "token";
  process.env.GITHUB_REPO = "owner/repo";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("a betoltes a tarolo sha-jat is visszaadja", async () => {
  stubGithub({ content: "---\ntitle: A\n---\ntorzs", sha: "sha-1" });

  const revision = await readBlogRevision("cikk");

  assert.equal(revision?.sha, "sha-1");
  assert.match(revision?.content ?? "", /torzs/);
});

test("elavult baseSha eseten a mentes elutasit, es nem ir", async () => {
  stubGithub({ content: "friss tartalom", sha: "sha-2" });

  await assert.rejects(
    () => saveBlogSource({
      slug: "cikk",
      content: "regi tartalom",
      message: "teszt",
      baseSha: "sha-1",
    }),
    (error: Error) => error.message === BLOG_CONFLICT,
  );

  assert.equal(calls.filter((call) => call.method === "PUT").length, 0);
});

test("uj cikk (baseSha null) nem irhat felul letezo slugot", async () => {
  stubGithub({ content: "letezo cikk", sha: "sha-2" });

  await assert.rejects(
    () => saveBlogSource({ slug: "cikk", content: "uj", message: "teszt", baseSha: null }),
    (error: Error) => error.message === BLOG_CONFLICT,
  );
  assert.equal(calls.filter((call) => call.method === "PUT").length, 0);
});

test("egyezo baseSha eseten commitol, es visszaadja az uj sha-t", async () => {
  stubGithub({ content: "regi", sha: "sha-1" });

  const result = await saveBlogSource({
    slug: "cikk",
    content: "uj tartalom",
    message: "teszt",
    baseSha: "sha-1",
  });

  assert.equal(result.mode, "github");
  assert.equal(result.sha, "sha-after-write");
  const put = calls.find((call) => call.method === "PUT");
  assert.equal(put?.body?.sha, "sha-1");
});

// A feltöltés és a migrációs utak nem adnak baseSha-t — ott marad a régi,
// ellenőrzés nélküli viselkedés (a PUT-nak saját `overwrite` kapuja van).
test("baseSha nelkul nincs utkozes-ellenorzes", async () => {
  stubGithub({ content: "regi", sha: "sha-9" });

  const result = await saveBlogSource({ slug: "cikk", content: "uj", message: "teszt" });

  assert.equal(result.mode, "github");
  assert.equal(calls.filter((call) => call.method === "PUT").length, 1);
});

// ── Cél-ág ────────────────────────────────────────────────────────────
//
// A preview deployment adminjából mentett cikk korábban a `main`-re ment:
// egy ág-előnézetből szerkesztve azonnal az ÉLES tartalom változott. A futó
// deploy saját ága a helyes default, az explicit env pedig felülbírálja.

test("a cel-ag alapbol a futo deploy sajat aga", () => {
  process.env.VERCEL_GIT_COMMIT_REF = "claude/blog-szerkeszto";
  assert.equal(blogStoreBranch(), "claude/blog-szerkeszto");
});

test("az explicit GITHUB_BRANCH felulbir", () => {
  process.env.VERCEL_GIT_COMMIT_REF = "feature/valami";
  process.env.GITHUB_BRANCH = "main";
  assert.equal(blogStoreBranch(), "main");
});

test("ag-informacio nelkul main a fallback", () => {
  assert.equal(blogStoreBranch(), "main");
});

test("a commit a cel-agra megy", async () => {
  process.env.VERCEL_GIT_COMMIT_REF = "feature/blog";
  stubGithub({ content: "regi", sha: "sha-1" });

  await saveBlogSource({ slug: "cikk", content: "uj", message: "teszt", baseSha: "sha-1" });

  const put = calls.find((call) => call.method === "PUT");
  assert.equal(put?.body?.branch, "feature/blog");
  assert.match(calls[0]!.url, /ref=feature\/blog/);
});

// ── Beszédes hiba fs-mód + Vercel esetén ──────────────────────────────
//
// Hiányzó GITHUB_TOKEN/GITHUB_REPO mellett a mód `fs`-re esik vissza, az
// API github-kapuja tehát nem lép be, és a mentés élesben egy csak olvasható
// fájlrendszerbe futott — a felületre ebből csak „SAVE_FAILED" jutott ki.

test("fs modban Vercelen beszedes hibaval allunk meg, nem EROFS-szal", async () => {
  delete process.env.BLOG_STORE;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_REPO;
  process.env.VERCEL = "1";

  await assert.rejects(
    () => saveBlogSource({ slug: "cikk", content: "torzs", message: "teszt" }),
    (error: Error) => error.message === BLOG_STORE_READ_ONLY,
  );
});
