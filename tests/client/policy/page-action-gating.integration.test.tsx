import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@/lib/i18n";
import { OrgMembersTab } from "@/components/org/OrgMembersTab";
import { OrgCampaignsTab } from "@/components/org/OrgCampaignsTab";
import { OrgTeamsTab } from "@/components/org/OrgTeamsTab";
import { ProfileHero } from "@/components/results/ProfileHero";
import { HiringDashboard } from "@/app/(app)/hiring/[orgId]/_components/HiringDashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({
    locale: "en",
    setLocale: vi.fn(),
    isChanging: false,
  }),
}));

vi.mock("@/components/org/OrgInviteForm", () => ({
  OrgInviteForm: () => <div data-testid="org-invite-form">Invite form</div>,
}));

vi.mock("@/components/org/OrgRemoveMemberButton", () => ({
  OrgRemoveMemberButton: () => <button type="button">Remove member</button>,
}));

vi.mock("@/components/org/OrgPendingInviteCancelButton", () => ({
  OrgPendingInviteCancelButton: () => <button type="button">Cancel pending invite</button>,
}));

vi.mock("@/components/org/CampaignCard", () => ({
  CampaignCard: ({ campaign }: { campaign: { name: string } }) => (
    <div data-testid="campaign-card">{campaign.name}</div>
  ),
}));

vi.mock("@/components/manager/TeamCreateForm", () => ({
  TeamCreateForm: () => <div data-testid="team-create-form">Team create form</div>,
}));

vi.mock("@/components/manager/CandidateInviteForm", () => ({
  CandidateInviteForm: () => <div data-testid="candidate-invite-form">Candidate invite form</div>,
}));

vi.mock("@/components/manager/CandidateRevokeButton", () => ({
  CandidateRevokeButton: () => <button type="button">Revoke candidate</button>,
}));

vi.mock("@/components/hiring/RequestCreditsButton", () => ({
  RequestCreditsButton: () => <button type="button">Request credits</button>,
}));

const actionGateCopy = {
  title: "Read-only mode",
  description: "Your current plan is read-only. Reactivate to continue.",
  ctaLabel: "Reactivate",
  ctaHref: "/billing/checkout?plan=org_monthly",
};

const baseMembers = [
  {
    id: "m_1",
    userId: "u_1",
    role: "ORG_ADMIN",
    joinedAt: "2026-03-01T00:00:00.000Z",
    user: { id: "u_1", email: "admin@trita.io", username: "admin" },
  },
];

const noPendingInvites: Array<{ id: string; email: string; role: string; createdAt: string }> = [];

function renderMembersTab(canInviteMembers: boolean) {
  return render(
    <OrgMembersTab
      members={baseMembers}
      pendingInvites={noPendingInvites}
      orgId="org_1"
      profileId="u_1"
      isManager
      isAdmin
      canInviteMembers={canInviteMembers}
      actionGateCopy={actionGateCopy}
      isHu={false}
      locale="en"
      dateLocale="en-GB"
    />,
  );
}

function renderCampaignsTab(canManageCampaigns: boolean) {
  return render(
    <OrgCampaignsTab
      orgId="org_1"
      campaigns={[]}
      isManager
      canManageCampaigns={canManageCampaigns}
      actionGateCopy={actionGateCopy}
      isHu={false}
    />,
  );
}

function renderTeamsTab(canCreateTeam: boolean) {
  return render(
    <OrgTeamsTab
      teams={[]}
      orgId="org_1"
      locale="en"
      isManager
      canCreateTeam={canCreateTeam}
      actionGateCopy={actionGateCopy}
      isHu={false}
    />,
  );
}

function renderHiringDashboard(canInviteNew: boolean) {
  return render(
    <HiringDashboard
      orgId="org_1"
      orgName="Trita Org"
      teams={[]}
      invites={[]}
      locale="en"
      planTier="org_monthly"
      creditBalance={null}
      canInviteNew={canInviteNew}
      isAdmin
    />,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
});

describe("E3 page action gating client tests", () => {
  describe("invite button gating", () => {
    it("active: invite form opens from the header button, no upsell gate (UX audit #18)", async () => {
      const user = userEvent.setup();
      renderMembersTab(true);

      // Az űrlap a fejléc „+ Tag meghívása" gombjára nyílik (nem a lista alján ül).
      expect(screen.queryByTestId("org-invite-form")).not.toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: new RegExp(t("org.members.inviteTitle", "en"), "i") }),
      );
      expect(screen.getByTestId("org-invite-form")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: actionGateCopy.ctaLabel })).not.toBeInTheDocument();
    });

    it.each(["restricted", "frozen"] as const)(
      "%s: hides direct invite action and shows disabled+upsell state",
      (state) => {
        renderMembersTab(false);

        const inviteTitle = t("org.members.inviteTitle", "en");
        expect(screen.queryByTestId("org-invite-form")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: inviteTitle })).not.toBeInTheDocument();
        expect(screen.getByText(inviteTitle).closest("span")).not.toBeNull();
        expect(screen.getByRole("link", { name: actionGateCopy.ctaLabel })).toHaveAttribute(
          "href",
          actionGateCopy.ctaHref,
        );

        expect(state).toBeDefined();
      },
    );
  });

  describe("create campaign gating", () => {
    it("active: can start a new campaign", () => {
      renderCampaignsTab(true);

      // Az inline űrlap helyett a CTA a wizardra mutató link.
      const cta = screen.getByRole("link", {
        name: new RegExp(t("org.campaigns.newCta", "en"), "i"),
      });
      expect(cta).toHaveAttribute("href", "/org/org_1/campaigns/new");
      expect(screen.queryByRole("link", { name: actionGateCopy.ctaLabel })).not.toBeInTheDocument();
    });

    it.each(["restricted", "frozen"] as const)(
      "%s: create campaign switches to disabled+upsell state",
      () => {
        renderCampaignsTab(false);

        const newCampaignLabel = t("org.campaigns.newCta", "en");
        expect(screen.queryByRole("button", { name: newCampaignLabel })).not.toBeInTheDocument();
        expect(screen.getByText(newCampaignLabel).closest("span")).not.toBeNull();
        expect(screen.getByRole("link", { name: actionGateCopy.ctaLabel })).toHaveAttribute(
          "href",
          actionGateCopy.ctaHref,
        );
      },
    );
  });

  describe("org settings actions gating", () => {
    it("active: team creation opens from the header button (UX audit #18)", async () => {
      const user = userEvent.setup();
      renderTeamsTab(true);

      // Az űrlap a fejléc „+ Új csapat" gombjára nyílik (nem a lista alján ül).
      expect(screen.queryByTestId("team-create-form")).not.toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: new RegExp(t("org.teams.newTitle", "en"), "i") }),
      );
      expect(screen.getByTestId("team-create-form")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: actionGateCopy.ctaLabel })).not.toBeInTheDocument();
    });

    it.each(["restricted", "frozen"] as const)(
      "%s: team/org management action is disabled with upsell CTA",
      () => {
        renderTeamsTab(false);

        const createTeamLabel = t("org.teams.newTitle", "en");
        expect(screen.queryByTestId("team-create-form")).not.toBeInTheDocument();
        expect(screen.getByText(createTeamLabel).closest("span")).not.toBeNull();
        expect(screen.getByRole("link", { name: actionGateCopy.ctaLabel })).toHaveAttribute(
          "href",
          actionGateCopy.ctaHref,
        );
      },
    );
  });

  describe("candidate create gating", () => {
    it("active: invite candidate action is enabled and opens the invite form", async () => {
      const user = userEvent.setup();
      renderHiringDashboard(true);

      const inviteCandidateButtons = screen.getAllByRole("button", {
        name: t("hiring.inviteCandidate", "en"),
      });
      expect(inviteCandidateButtons.length).toBeGreaterThan(0);
      expect(inviteCandidateButtons[0]).toBeEnabled();

      await user.click(inviteCandidateButtons[0]);
      expect(screen.getByTestId("candidate-invite-form")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: t("hiring.cancelButton", "en") }),
      ).toBeEnabled();
    });

    it.each(["restricted", "frozen"] as const)(
      "%s: invite candidate action is disabled and explanatory copy is visible",
      () => {
        renderHiringDashboard(false);

        const inviteCandidateButtons = screen.getAllByRole("button", {
          name: t("hiring.inviteCandidate", "en"),
        });
        expect(inviteCandidateButtons.length).toBeGreaterThan(0);
        for (const inviteCandidateButton of inviteCandidateButtons) {
          expect(inviteCandidateButton).toBeDisabled();
        }
        expect(
          screen.getByText("No credits available for new invites."),
        ).toBeInTheDocument();
      },
    );
  });

  describe("export action gating", () => {
    it("active: export action is clickable", async () => {
      const user = userEvent.setup();
      const onDownloadPdf = vi.fn();

      render(
        <ProfileHero
          userName="Alex"
          completedAt="April 1, 2026"
          personalityType="Strategic Builder"
          insight="Strong strategic focus"
          accessLevel="plus"
          onDownloadPdf={onDownloadPdf}
          pdfLoading={false}
        />,
      );

      const exportButton = screen.getByRole("button", {
        name: new RegExp(t("results.heroPdf", "en"), "i"),
      });
      expect(exportButton).toBeEnabled();
      await user.click(exportButton);
      expect(onDownloadPdf).toHaveBeenCalledTimes(1);
    });

    it.each(["restricted", "frozen"] as const)(
      "%s: export action can be rendered as disabled",
      () => {
        render(
          <ProfileHero
            userName="Alex"
            completedAt="April 1, 2026"
            personalityType="Strategic Builder"
            insight="Strong strategic focus"
            accessLevel="plus"
            onDownloadPdf={vi.fn()}
            pdfLoading
          />,
        );

        // A PDF-gomb betöltés alatt is a címkéjét mutatja (spinnerrel),
        // a korábbi "..." helyett — a gating lényege a disabled állapot.
        const exportButton = screen.getByRole("button", {
          name: new RegExp(t("results.heroPdf", "en"), "i"),
        });
        expect(exportButton).toBeDisabled();
      },
    );
  });

});
