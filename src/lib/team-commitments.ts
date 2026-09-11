import type { TeamActionTarget } from "@/lib/team-action-target";

/** Shared, serializable contract for the commitments workspace and API. */
export type CommitmentStatus = "not_started" | "in_progress" | "blocked" | "done";

export interface CommitmentEvent {
  id: string;
  eventType: string;
  actorName: string;
  createdAt: string;
  status: CommitmentStatus;
  note: string | null;
}

export interface TeamCommitment {
  id: string;
  title: string;
  description: string;
  nextStep: string;
  successCriteria: string;
  ownerUserId: string | null;
  ownerName: string | null;
  dueDate: string | null;
  status: CommitmentStatus;
  latestNote: string | null;
  targetMetric: TeamActionTarget | null;
  sourceReportId: string | null;
  sourceReportTitle: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  events: CommitmentEvent[];
}

export interface CommitmentPlan {
  focus: string;
  nextCheckInDate: string | null;
  version: number;
}

export interface CommitmentSuggestion {
  reportId: string;
  reportTitle: string;
  sourceActionKey: string;
  title: string;
  description: string;
  ownerName: string | null;
  dueDate: string | null;
  status: CommitmentStatus;
}

export interface TeamCommitmentsWorkspace {
  teamId: string;
  viewerId: string;
  canManage: boolean;
  canUpdateOwn: boolean;
  plan: CommitmentPlan;
  items: TeamCommitment[];
  assignees: Array<{ userId: string; name: string }>;
  suggestions: CommitmentSuggestion[];
}

export interface CommitmentFields {
  title: string;
  description: string;
  nextStep: string;
  successCriteria: string;
  ownerUserId: string | null;
  dueDate: string | null;
}

export type CommitmentMutation =
  | { action: "create"; fields: CommitmentFields }
  | { action: "import"; items: Array<{ reportId: string; sourceActionKey: string }> };

export type CommitmentPatch =
  | { action: "update"; id: string; expectedVersion: number; status: CommitmentStatus; note: string }
  | { action: "edit"; id: string; expectedVersion: number; fields: CommitmentFields }
  | { action: "plan"; expectedVersion: number; focus: string; nextCheckInDate: string | null };
