import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { BLOG_CONFLICT, readBlogRevision, saveBlogSource } from "@/lib/blog-store";

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
