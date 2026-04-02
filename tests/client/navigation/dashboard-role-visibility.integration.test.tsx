import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "@/app/dashboard/AdminDashboard";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({
    locale: "hu",
    setLocale: vi.fn(),
    isChanging: false,
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

function makeOrgStatusResponse(role: "ORG_ADMIN" | "ORG_MANAGER") {
  return {
    viewer: {
      role,
      isOrgAdmin: role === "ORG_ADMIN",
    },
    org: {
      id: "org_1",
      name: "Acme",
      status: "ACTIVE",
      createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    },
    teams: [],
    stats: {
      totalMembers: 0,
      completedCount: 0,
      pendingCount: 0,
      teamMapUnlocked: false,
      adminHasAssessment: false,
      firstTeamInviteUrl: null,
    },
    journey: {
      currentStage: "ORG_PARTIAL",
      completionSummary: {
        org: {
          activeCampaignCount: 0,
        },
      },
      nextBestAction: {
        explanation: "Kezdd a tagok meghívásával.",
        primary: {
          label: "Tagok kezelése",
          href: "/org/org_1?tab=members",
        },
        secondary: null,
      },
    },
  };
}

describe("F2 dashboard block visibility by role", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("admin sees onboarding-derived attention items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeOrgStatusResponse("ORG_ADMIN")), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Első csapat létrehozva")).toBeInTheDocument();
    });
  });

  it("manager does not see admin onboarding checklist items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeOrgStatusResponse("ORG_MANAGER")), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Első csapat létrehozva")).not.toBeInTheDocument();
    });
  });
});
