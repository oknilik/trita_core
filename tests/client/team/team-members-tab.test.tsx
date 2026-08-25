import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamMembersTab } from "@/components/team/TeamMembersTab";

const members = [
  {
    id: "member-1",
    userId: "kata",
    displayName: "Aurora Kata",
    email: "aurora-kata@trita.io",
    role: "MANAGER",
    joinedAt: "2026-08-18T10:00:00.000Z",
    hasAssessment: true,
    testType: "TRITAN",
  },
  {
    id: "member-2",
    userId: "bence",
    displayName: "Aurora Bence",
    email: "aurora-bence@trita.io",
    role: "MEMBER",
    joinedAt: "2026-08-19T10:00:00.000Z",
    hasAssessment: false,
    testType: null,
  },
];

describe("TeamMembersTab member directory", () => {
  it("a tagi nézetben csak a nevet és az e-mail-címet mutatja kártyákon", () => {
    render(
      <TeamMembersTab
        members={members}
        pendingInvites={[
          { id: "invite-1", email: "pending@trita.io", createdAt: "2026-08-20T10:00:00.000Z" },
        ]}
        teamId="team-1"
        profileId="kata"
        isOrgManager={false}
        canEmailInvite={false}
        addableOrgMembers={[]}
        memberDirectoryOnly
        isHu
        locale="hu"
        dateLocale="hu-HU"
      />,
    );

    expect(screen.getByRole("heading", { name: "A csapat tagjai" })).toBeInTheDocument();
    expect(screen.getByText("2 csapattárs")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("AK")).toBeInTheDocument();
    expect(screen.getByText("Aurora Kata")).toBeInTheDocument();
    expect(screen.getByText("aurora-kata@trita.io")).toBeInTheDocument();
    expect(screen.queryByText("Menedzser")).not.toBeInTheDocument();
    expect(screen.queryByText("Kitöltve")).not.toBeInTheDocument();
    expect(screen.queryByText("pending@trita.io")).not.toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });
});
