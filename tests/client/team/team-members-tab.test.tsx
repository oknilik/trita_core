import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamMembersTab } from "@/components/team/TeamMembersTab";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const members = [
  {
    id: "member-1",
    userId: "kata",
    displayName: "Aurora Kata",
    email: "aurora-kata@trita.io",
    role: "manager",
    joinedAt: "2026-08-18T10:00:00.000Z",
    hasAssessment: true,
    testType: "TRITAN",
  },
  {
    id: "member-2",
    userId: "bence",
    displayName: "Aurora Bence",
    email: "aurora-bence@trita.io",
    role: "member",
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
          { id: "invite-1", email: "pending@trita.io" },
        ]}
        teamId="team-1"
        profileId="kata"
        isOrgManager={false}
        canEmailInvite={false}
        addableOrgMembers={[]}
        isHu
        locale="hu"
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

  it("az org admin ugyanazokat a kártyákat kezeli, dosszié-hozzáférés nélkül", () => {
    render(
      <TeamMembersTab
        members={members}
        pendingInvites={[]}
        teamId="team-1"
        profileId="kata"
        isOrgManager
        canEmailInvite
        addableOrgMembers={[]}
        dossierBaseHref={null}
        isHu
        locale="hu"
      />,
    );

    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Tag hozzáadása/ })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("member");
    expect(screen.getByRole("button", { name: "Eltávolítás" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dossié" })).not.toBeInTheDocument();
    expect(screen.queryByText("Kitöltve")).not.toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it("a dosszié-akciót csak a tanácsadói kártyák kapják meg", () => {
    render(
      <TeamMembersTab
        members={members}
        pendingInvites={[]}
        teamId="team-1"
        profileId="consultant"
        isOrgManager
        canEmailInvite={false}
        addableOrgMembers={[]}
        dossierBaseHref="/org/org-1/members"
        isHu
        locale="hu"
      />,
    );

    const dossierLinks = screen.getAllByRole("link", { name: "Dossié" });
    expect(dossierLinks).toHaveLength(2);
    expect(dossierLinks[0]).toHaveAttribute(
      "href",
      "/org/org-1/members/kata",
    );
  });
});
