import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getTeamCommitmentsWorkspace, mutateTeamCommitments } from "@/lib/team-commitments.server";
import type { CommitmentFields, TeamCommitmentsWorkspace } from "@/lib/team-commitments";

function workspace(result: Awaited<ReturnType<typeof getTeamCommitmentsWorkspace>>): TeamCommitmentsWorkspace {
  assert.ok("workspace" in result, JSON.stringify(result));
  return result.workspace;
}

test("commitments preserve team scope, report snapshots and concurrent updates in PostgreSQL", async (t) => {
  const prefix = `commitment_${randomUUID().slice(0, 12)}`;
  const people = await Promise.all(["consultant", "manager", "member", "peer", "outsider"].map((name) =>
    prisma.userProfile.create({ data: { id: `${prefix}_${name}`, clerkId: `${prefix}_clerk_${name}`, username: name, email: `${prefix}_${name}@example.test` } }),
  ));
  const [consultant, manager, member, peer, outsider] = people;
  const org = await prisma.organization.create({ data: { name: prefix, ownerId: manager.id } });
  const team = await prisma.team.create({ data: { name: prefix, orgId: org.id, ownerId: manager.id } });
  const otherTeam = await prisma.team.create({ data: { name: `${prefix}_other`, orgId: org.id, ownerId: manager.id } });
  await prisma.organizationMember.createMany({ data: people.map((person) => ({ orgId: org.id, userId: person.id, role: person.id === consultant.id ? "ORG_CONSULTANT" : "ORG_MEMBER" })) });
  await prisma.teamMember.createMany({ data: [manager, member, peer].map((person) => ({ teamId: team.id, userId: person.id, role: person.id === manager.id ? "manager" : "member" })) });
  await prisma.teamMember.create({ data: { teamId: otherTeam.id, userId: outsider.id } });
  await prisma.subscription.create({ data: { orgId: org.id, status: "active", planType: "team" } });
  const originalActions = [{ id: "stable-action", title: "Shared decision log", description: "Capture owner and next step at the end of the meeting.", timeframe: "30", owner: member.username, status: "in_progress", note: "Already tried once.", dueDate: "2026-10-01" }];
  const report = await prisma.teamReport.create({ data: { teamId: team.id, orgId: org.id, createdById: consultant.id, status: "PUBLISHED", publishedAt: new Date(), title: "Published source", actionItems: originalActions, internalNotes: "PRIVATE_CONSULTANT_NOTE" } });
  let itemId = "";
  let sourceActionKey = "";
  const fields: CommitmentFields = { title: "Shared decision log", description: "Capture the decision.", nextStep: "Try it on Friday.", successCriteria: "Two meetings end with named owners.", ownerUserId: member.id, dueDate: "2026-10-01" };

  try {
    await t.test("GET is read-only, scoped, and never turns a matching owner name into a personal grant", async () => {
      const before = await prisma.teamCommitment.count({ where: { teamId: team.id } });
      const data = workspace(await getTeamCommitmentsWorkspace(team.id, consultant.id));
      assert.equal(data.items.length, 0);
      assert.equal(data.canManage, true);
      assert.equal(data.perspective, "team");
      assert.equal(data.suggestions.length, 1);
      sourceActionKey = data.suggestions[0].sourceActionKey;
      assert.equal(await prisma.teamCommitment.count({ where: { teamId: team.id } }), before);
      assert.equal(await prisma.teamCommitmentPlan.count({ where: { teamId: team.id } }), 0);
      assert.deepEqual(await getTeamCommitmentsWorkspace(team.id, outsider.id), { error: "FORBIDDEN", status: 403 });
      const memberData = workspace(await getTeamCommitmentsWorkspace(team.id, member.id));
      assert.equal(memberData.canManage, false);
      assert.equal(memberData.perspective, "personal");
      assert.equal(memberData.suggestions.length, 0);
      assert.ok(!JSON.stringify(data).includes("PRIVATE_CONSULTANT_NOTE"));
    });

    await t.test("concurrent explicit imports create one item and preserve the original progress", async () => {
      const input = { action: "import" as const, items: [{ reportId: report.id, sourceActionKey }] };
      const results = await Promise.all([mutateTeamCommitments(team.id, manager.id, input), mutateTeamCommitments(team.id, consultant.id, input)]);
      for (const result of results) workspace(result);
      const data = workspace(await getTeamCommitmentsWorkspace(team.id, member.id));
      assert.equal(data.items.length, 1);
      const item = data.items[0];
      itemId = item.id;
      assert.equal(item.ownerUserId, null);
      assert.equal(item.ownerName, member.username);
      assert.equal(item.status, "in_progress");
      assert.equal(item.latestNote, "Already tried once.");
      assert.equal(item.events.length, 1);
      const denied = await mutateTeamCommitments(team.id, member.id, { action: "update", id: itemId, expectedVersion: item.version, status: "done", note: "I share the legacy name." });
      assert.ok("error" in denied && denied.status === 403);
      assert.deepEqual((await prisma.teamReport.findUniqueOrThrow({ where: { id: report.id } })).actionItems, originalActions);
    });

    await t.test("only a current assignee may update, and only managers may change assignment", async () => {
      const item = workspace(await getTeamCommitmentsWorkspace(team.id, manager.id)).items[0];
      const invalid = await mutateTeamCommitments(team.id, manager.id, { action: "edit", id: itemId, expectedVersion: item.version, fields: { ...fields, ownerUserId: outsider.id } });
      assert.ok("error" in invalid && invalid.error === "OWNER_NOT_TEAM_MEMBER");
      const edited = workspace(await mutateTeamCommitments(team.id, manager.id, { action: "edit", id: itemId, expectedVersion: item.version, fields }));
      const assigned = edited.items.find((entry) => entry.id === itemId)!;
      assert.equal(assigned.ownerUserId, member.id);
      const denied = await mutateTeamCommitments(team.id, peer.id, { action: "update", id: itemId, expectedVersion: assigned.version, status: "blocked", note: "Someone else's item." });
      assert.ok("error" in denied && denied.status === 403);
      const forged = await mutateTeamCommitments(team.id, member.id, { action: "edit", id: itemId, expectedVersion: assigned.version, fields: { ...fields, ownerUserId: peer.id } });
      assert.ok("error" in forged && forged.status === 403);
    });

    await t.test("two updates with the same version cannot both win or leave orphan events", async () => {
      const item = workspace(await getTeamCommitmentsWorkspace(team.id, member.id)).items.find((entry) => entry.id === itemId)!;
      const beforeEvents = item.events.length;
      const results = await Promise.all([
        mutateTeamCommitments(team.id, member.id, { action: "update", id: itemId, expectedVersion: item.version, status: "blocked", note: "Need a decision from the lead." }),
        mutateTeamCommitments(team.id, manager.id, { action: "update", id: itemId, expectedVersion: item.version, status: "done", note: "We tried it twice." }),
      ]);
      assert.equal(results.filter((result) => "workspace" in result).length, 1);
      assert.equal(results.filter((result) => "error" in result && result.error === "VERSION_CONFLICT" && result.status === 409).length, 1);
      const saved = workspace(await getTeamCommitmentsWorkspace(team.id, member.id)).items.find((entry) => entry.id === itemId)!;
      assert.equal(saved.version, item.version + 1);
      assert.equal(saved.events.length, beforeEvents + 1);
      assert.ok(saved.events.some((event) => event.note === saved.latestNote && [member.username, manager.username].includes(event.actorName)));
    });

    await t.test("help and completion require a meaningful note", async () => {
      const item = workspace(await getTeamCommitmentsWorkspace(team.id, member.id)).items.find((entry) => entry.id === itemId)!;
      for (const status of ["blocked", "done"] as const) {
        const result = await mutateTeamCommitments(team.id, member.id, { action: "update", id: itemId, expectedVersion: item.version, status, note: "   " });
        assert.ok("error" in result && result.status === 400);
      }
      const unchanged = workspace(await getTeamCommitmentsWorkspace(team.id, member.id)).items.find((entry) => entry.id === itemId)!;
      assert.equal(unchanged.version, item.version);
    });

    await t.test("new reports and repeated imports never reset live commitments", async () => {
      const before = workspace(await getTeamCommitmentsWorkspace(team.id, member.id)).items.find((entry) => entry.id === itemId)!;
      await prisma.teamReport.create({ data: { teamId: team.id, orgId: org.id, createdById: consultant.id, status: "PUBLISHED", publishedAt: new Date(), title: "Next measurement", actionItems: [{ ...originalActions[0], title: "A later proposal" }] } });
      workspace(await mutateTeamCommitments(team.id, manager.id, { action: "import", items: [{ reportId: report.id, sourceActionKey }] }));
      await prisma.teamReport.update({ where: { id: report.id }, data: { status: "DRAFT", title: "Changed unpublished source", actionItems: [] } });
      const after = workspace(await getTeamCommitmentsWorkspace(team.id, member.id)).items.find((entry) => entry.id === itemId)!;
      assert.equal(after.status, before.status);
      assert.equal(after.version, before.version);
      assert.equal(after.latestNote, before.latestNote);
      assert.equal(after.sourceReportTitle, "Published source");
      assert.equal(after.events.length, before.events.length);
      const rejected = await mutateTeamCommitments(team.id, manager.id, { action: "import", items: [{ reportId: report.id, sourceActionKey }] });
      assert.ok("error" in rejected && rejected.status >= 400);
    });

    await t.test("legacy publication identity survives added ids, reordering and concurrent reimport", async () => {
      const legacyAction = { title: "Legacy next step", description: "The agreed original proposal.", timeframe: "30", owner: member.username };
      const legacyReport = await prisma.teamReport.create({ data: {
        teamId: team.id, orgId: org.id, createdById: consultant.id,
        status: "PUBLISHED", publishedAt: new Date(), title: "Legacy publication", actionItems: [legacyAction],
      } });
      const proposal = workspace(await getTeamCommitmentsWorkspace(team.id, manager.id)).suggestions.find((entry) => entry.reportId === legacyReport.id)!;
      const first = workspace(await mutateTeamCommitments(team.id, manager.id, { action: "import", items: [{ reportId: legacyReport.id, sourceActionKey: proposal.sourceActionKey }] }));
      const imported = first.items.find((entry) => entry.sourceReportId === legacyReport.id)!;
      workspace(await mutateTeamCommitments(team.id, manager.id, { action: "update", id: imported.id, expectedVersion: imported.version, status: "in_progress", note: "Already progressing since the first publication." }));
      const before = await prisma.teamCommitment.findUniqueOrThrow({ where: { id: imported.id }, include: { events: true } });

      // Mirrors the existing report API's normal save: missing ids and the
      // default status are assigned; another proposal may precede this one.
      await prisma.teamReport.update({ where: { id: legacyReport.id }, data: { status: "DRAFT", publishedAt: null } });
      await prisma.teamReport.update({ where: { id: legacyReport.id }, data: {
        status: "PUBLISHED", publishedAt: new Date(), actionItems: [
          { ...legacyAction, id: "new-before", title: "A separate proposal" },
          { ...legacyAction, id: "assigned-on-save", status: "not_started" },
          { ...legacyAction, id: "intentional-duplicate", status: "not_started" },
        ],
      } });
      const suggestions = workspace(await getTeamCommitmentsWorkspace(team.id, consultant.id)).suggestions.filter((entry) => entry.reportId === legacyReport.id);
      assert.deepEqual(suggestions.map((entry) => entry.sourceActionKey), ["id:new-before", "id:intentional-duplicate"]);
      const reimport = { action: "import" as const, items: [{ reportId: legacyReport.id, sourceActionKey: "id:assigned-on-save" }] };
      for (const result of await Promise.all([mutateTeamCommitments(team.id, manager.id, reimport), mutateTeamCommitments(team.id, consultant.id, reimport)])) workspace(result);
      assert.equal(await prisma.teamCommitment.count({ where: { teamId: team.id, sourceReportId: legacyReport.id } }), 1);
      assert.deepEqual(await prisma.teamCommitment.findUniqueOrThrow({ where: { id: imported.id }, include: { events: true } }), before);

      // A separate real id with identical content is still a deliberate second
      // commitment. Competing imports create exactly one copy of that proposal.
      const separate = { action: "import" as const, items: [{ reportId: legacyReport.id, sourceActionKey: "id:intentional-duplicate" }] };
      for (const result of await Promise.all([mutateTeamCommitments(team.id, manager.id, separate), mutateTeamCommitments(team.id, consultant.id, separate)])) workspace(result);
      assert.equal(await prisma.teamCommitment.count({ where: { teamId: team.id, sourceReportId: legacyReport.id } }), 2);
      assert.equal(workspace(await getTeamCommitmentsWorkspace(team.id, manager.id)).suggestions.filter((entry) => entry.reportId === legacyReport.id).length, 1);
      assert.deepEqual(await prisma.teamCommitment.findUniqueOrThrow({ where: { id: imported.id }, include: { events: true } }), before);
    });

    await t.test("concurrent creation of the shared plan has one winner", async () => {
      const results = await Promise.all(["Clearer decisions", "Better meetings"].map((focus) => mutateTeamCommitments(team.id, manager.id, { action: "plan", expectedVersion: 0, focus, nextCheckInDate: "2026-10-05" })));
      assert.equal(results.filter((result) => "workspace" in result).length, 1);
      assert.equal(results.filter((result) => "error" in result && result.error === "VERSION_CONFLICT").length, 1);
      assert.equal(workspace(await getTeamCommitmentsWorkspace(team.id, member.id)).plan.version, 1);
    });

    await t.test("departed assignees and read-only subscriptions cannot mutate", async () => {
      let item = workspace(await getTeamCommitmentsWorkspace(team.id, member.id)).items.find((entry) => entry.id === itemId)!;
      await prisma.teamMember.delete({ where: { teamId_userId: { teamId: team.id, userId: member.id } } });
      const departed = await mutateTeamCommitments(team.id, member.id, { action: "update", id: itemId, expectedVersion: item.version, status: "in_progress", note: "Left the team." });
      assert.ok("error" in departed && departed.status === 403);
      await prisma.subscription.update({ where: { orgId: org.id }, data: { status: "past_due" } });
      const readonly = workspace(await getTeamCommitmentsWorkspace(team.id, manager.id));
      assert.equal(readonly.canManage, false);
      assert.equal(readonly.perspective, "team");
      assert.equal(readonly.canUpdateOwn, false);
      item = readonly.items.find((entry) => entry.id === itemId)!;
      const denied = await mutateTeamCommitments(team.id, manager.id, { action: "update", id: itemId, expectedVersion: item.version, status: "in_progress", note: "Read-only." });
      assert.ok("error" in denied && denied.status === 403);
      await prisma.subscription.update({ where: { orgId: org.id }, data: { status: "canceled", currentPeriodEnd: new Date("2020-01-01") } });
      const frozen = await getTeamCommitmentsWorkspace(team.id, consultant.id);
      assert.ok("error" in frozen && frozen.status === 403);
    });
  } finally {
    await prisma.team.deleteMany({ where: { id: { in: [team.id, otherTeam.id] } } });
    await prisma.organizationMember.deleteMany({ where: { orgId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    await prisma.userProfile.deleteMany({ where: { id: { in: people.map((person) => person.id) } } });
  }
});
