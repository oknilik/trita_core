import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type TeamCommitment as CommitmentRecord } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessTeam, canManageTeam } from "@/lib/team-auth";
import { isPolicyReadOnly, resolveTeamPolicySnapshot } from "@/lib/policy-service";
import { parseTeamActionTarget } from "@/lib/team-action-target";
import { commitmentMutationSchema, commitmentPatchSchema, commitmentStatusSchema } from "@/lib/team-commitment-schema";
import { commitmentSourceActions } from "@/lib/team-commitments-source";
import type {
  CommitmentMutation,
  CommitmentPatch,
  CommitmentStatus,
  TeamCommitmentsWorkspace,
} from "@/lib/team-commitments";

type Failure = { error: string; status: number };
export type CommitmentsResult = { workspace: TeamCommitmentsWorkspace } | Failure;
type Access = { orgId: string; perspective: "team" | "personal"; canManage: boolean; canUpdateOwn: boolean; writable: boolean };

const failure = (error: string, status: number): Failure => ({ error, status });

/** Read and write paths share the same live org/team/subscription boundary. */
async function resolveAccess(teamId: string, profileId: string): Promise<Access | Failure> {
  const [profile, team] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: profileId }, select: { id: true, deleted: true } }),
    prisma.team.findUnique({ where: { id: teamId }, select: { orgId: true } }),
  ]);
  if (!profile || profile.deleted) return failure("UNAUTHORIZED", 401);
  if (!team?.orgId) return failure("NOT_FOUND", 404);
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profileId } },
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) return failure("FORBIDDEN", 403);
  if (!(await canAccessTeam(profileId, teamId, membership.role))) return failure("FORBIDDEN", 403);
  const [snapshot, hasManagementRole] = await Promise.all([
    resolveTeamPolicySnapshot({ orgId: team.orgId, orgRole: membership.role, teamId, profileId }),
    canManageTeam(profileId, teamId, membership.role),
  ]);
  if (snapshot.policy.policyState === "frozen" || snapshot.policy.policyState === "none") {
    return failure("CAPABILITY_DENIED", 403);
  }
  const writable = !isPolicyReadOnly(snapshot.policy.policyState);
  return {
    orgId: team.orgId,
    perspective: hasManagementRole ? "team" : "personal",
    writable,
    canManage: writable && snapshot.policy.capabilities.has("teamManage"),
    canUpdateOwn: writable && snapshot.subject.membership?.hasTeamMembership === true,
  };
}

function publicName(profile: { username: string | null; deleted: boolean } | undefined): string | null {
  const name = profile?.deleted ? null : profile?.username?.trim();
  // No email fallback, including legacy accounts whose username is an email.
  return name && !/\S+@\S+\.\S+/u.test(name) ? name : null;
}

function status(value: unknown): CommitmentStatus {
  const parsed = commitmentStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "not_started";
}

function sourceTitle(snapshot: Prisma.JsonValue | null): string | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  return typeof snapshot.reportTitle === "string" ? snapshot.reportTitle : null;
}

const sourceReportSelect = {
  id: true, title: true, publishedAt: true, actionItems: true,
} satisfies Prisma.TeamReportSelect;

async function readWorkspace(teamId: string, profileId: string, access: Access): Promise<TeamCommitmentsWorkspace> {
  const [items, plan, assignees, reports] = await Promise.all([
    prisma.teamCommitment.findMany({
      where: { teamId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { events: { orderBy: { version: "desc" } } },
    }),
    prisma.teamCommitmentPlan.findUnique({ where: { teamId } }),
    access.canManage ? prisma.teamMember.findMany({
      where: { teamId, user: { deleted: false, orgMemberships: { some: { orgId: access.orgId, leftAt: null } } } },
      select: { userId: true, user: { select: { username: true, deleted: true } } },
      orderBy: { joinedAt: "asc" },
    }) : Promise.resolve([]),
    access.canManage ? prisma.teamReport.findMany({
      where: { teamId, status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }], select: sourceReportSelect,
    }) : Promise.resolve([]),
  ]);
  const userIds = [...new Set(items.flatMap((item) => [
    ...(item.ownerUserId ? [item.ownerUserId] : []), ...item.events.map((event) => event.actorUserId),
  ]))];
  const profiles = userIds.length ? await prisma.userProfile.findMany({
    where: { id: { in: userIds } }, select: { id: true, username: true, deleted: true },
  }) : [];
  const names = new Map(profiles.map((profile) => [profile.id, publicName(profile)]));
  const imported = new Set(items.filter((item) => item.sourceReportId && item.sourceActionKey)
    .map((item) => JSON.stringify([item.sourceReportId, item.sourceActionKey])));
  return {
    teamId,
    viewerId: profileId,
    perspective: access.perspective,
    canManage: access.canManage,
    canUpdateOwn: access.canUpdateOwn,
    plan: { focus: plan?.focus ?? "", nextCheckInDate: plan?.nextCheckInDate ?? null, version: plan?.version ?? 0 },
    items: items.map((item) => ({
      id: item.id, title: item.title, description: item.description,
      nextStep: item.nextStep, successCriteria: item.successCriteria,
      ownerUserId: item.ownerUserId,
      ownerName: item.ownerUserId ? names.get(item.ownerUserId) ?? null : item.ownerLabel,
      dueDate: item.dueDate, status: status(item.status), latestNote: item.latestNote,
      targetMetric: parseTeamActionTarget(item.targetMetric) ?? null,
      sourceReportId: item.sourceReportId, sourceReportTitle: sourceTitle(item.sourceSnapshot),
      createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), version: item.version,
      events: item.events.map((event) => ({
        id: event.id, eventType: event.eventType,
        actorName: names.get(event.actorUserId) ?? "–",
        createdAt: event.createdAt.toISOString(), note: event.note,
        status: status(event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
          ? event.payload.status : undefined),
      })),
    })),
    assignees: assignees.map((member) => ({ userId: member.userId, name: publicName(member.user) ?? "–" })),
    suggestions: reports.flatMap((report) => commitmentSourceActions(report)
      .filter(({ sourceActionKey }) => !imported.has(JSON.stringify([report.id, sourceActionKey])))
      .map(({ sourceActionKey, item }) => ({
        reportId: report.id, reportTitle: report.title ?? "–", sourceActionKey,
        title: item.title, description: item.description,
        ownerName: item.owner ?? null, dueDate: item.dueDate ?? null, status: status(item.status),
      }))),
  };
}

/** GET is strictly read-only: report proposals become commitments only via POST import. */
export async function getTeamCommitmentsWorkspace(teamId: string, profileId: string): Promise<CommitmentsResult> {
  const access = await resolveAccess(teamId, profileId);
  if ("error" in access) return access;
  return { workspace: await readWorkspace(teamId, profileId, access) };
}

class CommitmentError extends Error {
  constructor(readonly error: string, readonly status: number) { super(error); }
}

async function validateOwner(tx: Prisma.TransactionClient, teamId: string, orgId: string, ownerUserId: string | null) {
  if (!ownerUserId) return;
  const owner = await tx.teamMember.findFirst({
    where: {
      teamId, userId: ownerUserId,
      user: { deleted: false, orgMemberships: { some: { orgId, leftAt: null } } },
    },
    select: { id: true },
  });
  if (!owner) throw new CommitmentError("OWNER_NOT_TEAM_MEMBER", 400);
}

async function appendEvent(
  tx: Prisma.TransactionClient, item: CommitmentRecord, actorUserId: string, eventType: string, note: string | null,
) {
  // These records contain public commitment fields and the sanitized source
  // snapshot only. Keeping the complete version makes every item change auditable.
  const payload = JSON.parse(JSON.stringify(item)) as Prisma.InputJsonValue;
  await tx.teamCommitmentEvent.create({
    data: { commitmentId: item.id, actorUserId, eventType, version: item.version, payload, note },
  });
}

/** All item writes use compare-and-swap and append their event in the SAME transaction. */
export async function mutateTeamCommitments(
  teamId: string, profileId: string, input: CommitmentMutation | CommitmentPatch,
): Promise<CommitmentsResult> {
  const parsed = input?.action === "create" || input?.action === "import"
    ? commitmentMutationSchema.safeParse(input) : commitmentPatchSchema.safeParse(input);
  if (!parsed.success) return failure("INVALID_INPUT", 400);
  const mutation = parsed.data;
  const access = await resolveAccess(teamId, profileId);
  if ("error" in access) return access;
  if (!access.writable) return failure("CAPABILITY_DENIED", 403);
  if (mutation.action !== "update" && !access.canManage) return failure("FORBIDDEN", 403);
  if (mutation.action === "update" && !access.canManage && !access.canUpdateOwn) return failure("FORBIDDEN", 403);
  if (mutation.action === "update" && ["blocked", "done"].includes(mutation.status) && !mutation.note) {
    return failure("NOTE_REQUIRED", 400);
  }
  try {
    await prisma.$transaction(async (tx) => {
      if (mutation.action === "create") {
        await validateOwner(tx, teamId, access.orgId, mutation.fields.ownerUserId);
        const item = await tx.teamCommitment.create({
          data: { ...mutation.fields, teamId, createdById: profileId, status: "not_started" },
        });
        await appendEvent(tx, item, profileId, "CREATED", null);
        return;
      }
      if (mutation.action === "import") {
        const reports = await tx.teamReport.findMany({
          where: { teamId, id: { in: mutation.items.map((item) => item.reportId) }, status: "PUBLISHED" },
          select: sourceReportSelect,
        });
        // Stable lock order also covers overlapping imports submitted in
        // different UI orders, avoiding duplicate work and lock-order inversions.
        const selections = [...new Map(mutation.items.map((item) => [
          JSON.stringify([item.reportId, item.sourceActionKey]), item,
        ])).entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, item]) => item);
        for (const selected of selections) {
          const report = reports.find((candidate) => candidate.id === selected.reportId);
          if (!report) throw new CommitmentError("SOURCE_NOT_PUBLISHED", 409);
          const source = commitmentSourceActions(report).find((candidate) => candidate.sourceActionKey === selected.sourceActionKey);
          if (!source) throw new CommitmentError("NOT_FOUND", 404);
          const item = source.item;
          const id = randomUUID();
          // ON CONFLICT DO NOTHING is idempotent even for simultaneous imports.
          // A losing importer never updates the already edited commitment.
          const created = await tx.teamCommitment.createMany({
            data: [{
              id, teamId, title: item.title, description: item.description,
              ownerUserId: null, ownerLabel: item.owner ?? null, dueDate: item.dueDate ?? null,
              status: item.status ?? "not_started", latestNote: item.note ?? null,
              ...(item.targetMetric ? { targetMetric: item.targetMetric as unknown as Prisma.InputJsonValue } : {}),
              sourceReportId: report.id, sourceActionKey: source.sourceActionKey,
              sourceSnapshot: JSON.parse(JSON.stringify({
                reportId: report.id, reportTitle: report.title, publishedAt: report.publishedAt?.toISOString() ?? null,
                action: item,
              })) as Prisma.InputJsonValue,
              createdById: profileId,
            }],
            skipDuplicates: true,
          });
          if (created.count === 1) {
            const imported = await tx.teamCommitment.findUniqueOrThrow({ where: { id } });
            await appendEvent(tx, imported, profileId, "IMPORTED", item.note ?? null);
          }
        }
        return;
      }
      if (mutation.action === "plan") {
        const data = { focus: mutation.focus, nextCheckInDate: mutation.nextCheckInDate, updatedById: profileId };
        if (mutation.expectedVersion === 0) {
          // Concurrent first edits contend on the team's primary key; one loses.
          await tx.teamCommitmentPlan.create({ data: { teamId, ...data } });
        } else {
          const updated = await tx.teamCommitmentPlan.updateMany({
            where: { teamId, version: mutation.expectedVersion }, data: { ...data, version: { increment: 1 } },
          });
          if (updated.count !== 1) throw new CommitmentError("VERSION_CONFLICT", 409);
        }
        return;
      }
      const current = await tx.teamCommitment.findFirst({ where: { id: mutation.id, teamId } });
      if (!current) throw new CommitmentError("NOT_FOUND", 404);
      if (!access.canManage && current.ownerUserId !== profileId) throw new CommitmentError("FORBIDDEN", 403);
      if (mutation.action === "edit") await validateOwner(tx, teamId, access.orgId, mutation.fields.ownerUserId);
      const data: Prisma.TeamCommitmentUpdateManyMutationInput = mutation.action === "edit"
        ? { ...mutation.fields, ownerLabel: !current.ownerUserId && !mutation.fields.ownerUserId ? current.ownerLabel : null, version: { increment: 1 } }
        : { status: mutation.status, latestNote: mutation.note || current.latestNote, version: { increment: 1 } };
      const updated = await tx.teamCommitment.updateMany({
        where: {
          id: current.id, teamId, version: mutation.expectedVersion,
          ...(!access.canManage ? { ownerUserId: profileId } : {}),
        },
        data,
      });
      if (updated.count !== 1) throw new CommitmentError("VERSION_CONFLICT", 409);
      const item = await tx.teamCommitment.findUniqueOrThrow({ where: { id: current.id } });
      await appendEvent(tx, item, profileId, mutation.action === "edit" ? "EDITED" : "UPDATED",
        mutation.action === "update" ? mutation.note || null : null);
    });
  } catch (error) {
    if (error instanceof CommitmentError) return failure(error.error, error.status);
    if (mutation.action === "plan" && mutation.expectedVersion === 0 &&
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return failure("VERSION_CONFLICT", 409);
    }
    throw error;
  }
  return getTeamCommitmentsWorkspace(teamId, profileId);
}
