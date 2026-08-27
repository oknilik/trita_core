import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvitationsTab } from "@/components/results/InvitationsTab";
import type {
  SerializedReceivedInvitation,
  SerializedSentInvitation,
} from "@/components/profile/ProfileTabs";

const showToast = vi.fn();

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ showToast }),
}));

const SENT: SerializedSentInvitation[] = [
  {
    id: "completed-1",
    token: "completed-token",
    status: "COMPLETED",
    createdAt: "2026-08-20T10:00:00.000Z",
    completedAt: "2026-08-22",
    observerEmail: null,
    observerName: "Aurora Réka",
    observerType: "TEAM",
  },
  {
    id: "pending-1",
    token: "pending-token",
    status: "PENDING",
    createdAt: "2026-08-23T10:00:00.000Z",
    completedAt: null,
    observerEmail: "observer@example.com",
    observerName: null,
    observerType: "EXTERNAL",
  },
];

const RECEIVED: SerializedReceivedInvitation[] = [];

describe("InvitationsTab – új observer design", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ colleagues: [] }), { status: 200 }),
    ));
  });

  it("riportfejezetként jeleníti meg az állapotot és a meghívókezelést", () => {
    render(
      <InvitationsTab
        sentInvitations={SENT}
        receivedInvitations={RECEIVED}
        isPlus
        minForReveal={3}
      />,
    );

    expect(screen.getByTestId("observer-invitations-surface")).toHaveClass("gap-8");
    expect(screen.getByRole("heading", { name: /Kérd ki mások véleményét/i })).toBeInTheDocument();
    expect(screen.getByText("Aurora Réka")).toBeInTheDocument();
    expect(screen.getByText("observer@example.com")).toBeInTheDocument();
  });

  it("mobilon egymás alá teszi az email mezőt és az elsődleges műveletet", () => {
    render(
      <InvitationsTab
        sentInvitations={SENT}
        receivedInvitations={RECEIVED}
        isPlus
      />,
    );

    const emailInput = screen.getByRole("textbox");
    expect(emailInput.parentElement).toHaveClass("flex-col", "sm:flex-row");
    expect(screen.getByRole("button", { name: /Létrehozás/i })).toHaveClass("min-h-[50px]");
    expect(screen.getByRole("button", { name: "QR" })).toHaveClass("min-h-[44px]");
  });

  it("szervezeti körben az új, számozott kolléga-lépést használja", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        colleagues: [
          { userId: "user-1", name: "Aurora Levente", isTeammate: true, alreadyInvited: false },
        ],
      }), { status: 200 }),
    ));

    render(
      <InvitationsTab
        sentInvitations={SENT}
        receivedInvitations={RECEIVED}
        isPlus
        hasColleagueDirectory
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Aurora Levente")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Meghívom/i })).toHaveClass("min-h-[44px]");
  });
});
