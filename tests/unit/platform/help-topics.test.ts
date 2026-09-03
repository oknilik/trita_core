import assert from "node:assert/strict";
import test from "node:test";
import { getHelpTopics, type HelpAudience } from "@/lib/help/topics";

const AUDIENCES: HelpAudience[] = ["public", "member", "manager", "admin"];

test("getHelpTopics returns only entries scoped to the audience", () => {
  for (const audience of AUDIENCES) {
    const topics = getHelpTopics(audience);
    assert.ok(topics.length > 0, `${audience}: expected at least one topic`);
    for (const topic of topics) {
      assert.ok(
        topic.entries.length > 0,
        `${audience}/${topic.id}: empty topics must be filtered out`,
      );
      for (const entry of topic.entries) {
        assert.ok(
          entry.audiences.includes(audience),
          `${audience}/${topic.id}/${entry.id}: entry leaked to wrong audience`,
        );
      }
    }
  }
});

test("public audience never sees signed-in-only guidance", () => {
  const publicTopicIds = getHelpTopics("public").map((t) => t.id);
  assert.ok(!publicTopicIds.includes("team-management"));
  assert.ok(!publicTopicIds.includes("org-admin"));
});

test("manager sees gating explanation, member does not see admin topics", () => {
  const managerEntryIds = getHelpTopics("manager").flatMap((t) =>
    t.entries.map((e) => e.id),
  );
  assert.ok(managerEntryIds.includes("why-gated"));
  assert.ok(managerEntryIds.includes("when-team-results"));

  const memberTopicIds = getHelpTopics("member").map((t) => t.id);
  assert.ok(!memberTopicIds.includes("org-admin"));
});

test("every entry has non-empty HU and EN texts", () => {
  for (const audience of AUDIENCES) {
    for (const topic of getHelpTopics(audience)) {
      for (const entry of topic.entries) {
        for (const localized of [entry.question, entry.answer]) {
          assert.ok(localized.hu.trim().length > 0);
          assert.ok(localized.en.trim().length > 0);
        }
        for (const step of entry.steps ?? []) {
          assert.ok(step.hu.trim().length > 0);
          assert.ok(step.en.trim().length > 0);
        }
        if (entry.link) {
          assert.ok(entry.link.href.startsWith("/"), `${entry.id}: internal link expected`);
        }
      }
    }
  }
});

test("help copy follows the current results and measurement terminology", () => {
  const entries = getHelpTopics("admin").flatMap((topic) => topic.entries);
  const invite = entries.find((entry) => entry.id === "how-invite");
  const measurement = entries.find((entry) => entry.id === "start-campaign");
  const orgAdmin = entries.find((entry) => entry.id === "manage-org");

  assert.match(invite?.answer.hu ?? "", /Külső kép/);
  assert.match(measurement?.question.hu ?? "", /mérés/);
  assert.match(measurement?.answer.hu ?? "", /tanácsadó/);
  assert.doesNotMatch(orgAdmin?.answer.hu ?? "", /kampány/);
});
