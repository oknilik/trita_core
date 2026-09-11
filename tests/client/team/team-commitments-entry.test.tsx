import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TeamCommitment, TeamCommitmentsWorkspace } from "@/lib/team-commitments";
import type { SerializedTeamReport } from "@/lib/team-report";
import type { TeamTabContext } from "@/app/(app)/team/[id]/_tabs/types";
import { TeamTabBar } from "@/app/(app)/team/[id]/_tabs/TeamTabBar";
import { TeamCommitmentsOverview } from "@/app/(app)/team/[id]/_tabs/TeamCommitmentsOverview";
import { TeamReportView } from "@/components/team/TeamReportView";
import { TeamReportMemberView } from "@/components/team/TeamReportMemberView";
import { TeamWorkshopFacilitatorView } from "@/components/team/TeamWorkshopFacilitatorView";

vi.mock("@/components/team/TeamReportPdfButton", () => ({ TeamReportPdfButton: () => null }));

function item(overrides: Partial<TeamCommitment> = {}): TeamCommitment {
  return {
    id: "own", title: "Saját következő lépés", description: "", nextStep: "Egyeztetem az első próbát.",
    successCriteria: "", ownerUserId: "viewer", ownerName: "Anna", dueDate: "2026-09-20",
    status: "not_started", latestNote: null, targetMetric: null, sourceReportId: null, sourceReportTitle: null,
    createdAt: "2026-09-10T09:00:00Z", updatedAt: "2026-09-10T09:00:00Z", version: 1, events: [],
    ...overrides,
  };
}

function workspace(overrides: Partial<TeamCommitmentsWorkspace> = {}): TeamCommitmentsWorkspace {
  return {
    teamId: "team-1", viewerId: "viewer", perspective: "personal", canManage: false, canUpdateOwn: true,
    plan: { focus: "Kiszámítható egyeztetés", nextCheckInDate: "2026-09-18", version: 1 },
    items: [], suggestions: [], assignees: [], ...overrides,
  };
}

function report(overrides: Partial<SerializedTeamReport> = {}): SerializedTeamReport {
  return {
    id: "report-1", teamId: "team-1", status: "PUBLISHED", title: "Jóváhagyott riport", aggregates: null,
    summary: "Eredeti, jóváhagyott értelmezés.", strengths: null, risks: null, recommendations: null,
    interviewFindings: null, leadershipGuide: null, internalNotes: null, translationsEn: null,
    actionItems: [{ title: "A riport eredeti javaslata", description: "Eredeti leírás", timeframe: "30", owner: "Csapatvezető" }],
    publishedAt: "2026-09-10T09:00:00Z", createdAt: "2026-09-10T09:00:00Z", updatedAt: "2026-09-10T09:00:00Z",
    ...overrides,
  };
}

describe("Vállalások navigáció", () => {
  it.each([
    { role: "member", canViewRaw: false, isOrgManager: false, isTeamMemberSelf: true },
    { role: "manager", canViewRaw: false, isOrgManager: true, isTeamMemberSelf: false },
    { role: "consultant", canViewRaw: true, isOrgManager: true, isTeamMemberSelf: false },
  ])("$role publikált riport nélkül is eléri a közös fület", (role) => {
    const ctx = {
      ...role, teamId: "team-1", locale: "hu", isHu: true, hasPublishedReport: false,
      teamData: { memberCount: 5, pendingInvites: [] },
    } as unknown as TeamTabContext;
    render(<TeamTabBar ctx={ctx} active="commitments" />);
    const link = screen.getByRole("link", { name: "Vállalások" });
    expect(link).toHaveAttribute("href", "/team/team-1?tab=commitments");
    expect(link).toHaveAttribute("aria-current", "page");
    if (!role.canViewRaw) {
      expect(screen.queryByRole("link", { name: "Elemzések" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Riport" })).not.toBeInTheDocument();
    }
  });
});

describe("Vállalások áttekintő", () => {
  it("a tag saját lépésére visz akkor is, ha más vállalás segítséget kér", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-11T12:00:00Z"));
    render(<TeamCommitmentsOverview isHu workspace={workspace({ items: [
      item({ id: "other", ownerUserId: "other", title: "Más elakadása", status: "blocked" }), item(),
    ] })} />);
    expect(screen.getByRole("heading", { name: "A te következő lépésed" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saját következő lépés" })).toBeInTheDocument();
    expect(screen.queryByText("Más elakadása")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vállalás megnyitása" })).toHaveAttribute("href", "/team/team-1?tab=commitments#commitment-own");
    expect(screen.getByText(/Határidő:/)).toHaveTextContent("20");
    expect(screen.getByText(/Közös ránézés:/)).toHaveTextContent("18");
  });

  it("a szöveges régi felelős nem lesz saját hozzárendelés", () => {
    render(<TeamCommitmentsOverview isHu workspace={workspace({ items: [item({ ownerUserId: null, ownerName: "Anna" })] })} />);
    expect(screen.getByText(/Jelenleg nincs hozzád rendelt nyitott vállalás/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Saját következő lépés" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vállalások megnyitása" })).toHaveAttribute("href", "/team/team-1?tab=commitments");
  });

  it("a vezető a közös segítségkérést látja elsőként, lezárt feladat nélkül", () => {
    render(<TeamCommitmentsOverview isHu workspace={workspace({ perspective: "team", canManage: true, items: [
      item(), item({ id: "blocked", title: "Közös döntés kell", status: "blocked", ownerUserId: "other" }),
      item({ id: "done", title: "Már kész", status: "done" }),
    ] })} />);
    expect(screen.getByRole("heading", { name: "A csapat következő lépése" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Közös döntés kell" })).toBeInTheDocument();
    expect(screen.getByText("2 nyitott vállalás a csapatban")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vállalás megnyitása" })).toHaveAttribute("href", "/team/team-1?tab=commitments#commitment-blocked");
  });

  it("üres vezetői állapotban a publikált javaslatokat ajánlja, nem importál automatikusan", () => {
    render(<TeamCommitmentsOverview isHu workspace={workspace({ perspective: "team", canManage: true, suggestions: [{
      reportId: "report-1", reportTitle: "Riport", sourceActionKey: "action-1", title: "Javaslat", description: "", ownerName: null, dueDate: null, status: "not_started",
    }] })} />);
    expect(screen.getByText(/A publikált riportból 1 javaslat emelhető át/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Riportjavaslatok áttekintése" })).toHaveAttribute("href", "/team/team-1?tab=commitments");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("üres angol tagállapot érthető közös belépőt ad", () => {
    render(<TeamCommitmentsOverview isHu={false} workspace={workspace()} />);
    expect(screen.getByText(/Shared commitments will appear here/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open commitments" })).toHaveAttribute("href", "/team/team-1?tab=commitments");
  });

  it("a csak olvasó vezető megtartja a csapatszintű perspektíváját", () => {
    render(<TeamCommitmentsOverview isHu workspace={workspace({ perspective: "team", canManage: false, canUpdateOwn: false, items: [
      item({ id: "other", title: "A csapat elakadása", ownerUserId: "other", status: "blocked" }),
    ] })} />);
    expect(screen.getByRole("heading", { name: "A csapat következő lépése" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A csapat elakadása" })).toBeInTheDocument();
    expect(screen.getByText("1 nyitott vállalás a csapatban")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vállalás megnyitása" })).toHaveAttribute("href", "/team/team-1?tab=commitments#commitment-other");
    expect(screen.queryByRole("link", { name: "Első vállalás rögzítése" })).not.toBeInTheDocument();
  });

  it("üres csak olvasható állapot nem ígér szerkesztést vagy új vállalást", () => {
    render(<TeamCommitmentsOverview isHu workspace={workspace({ perspective: "team", canManage: false, canUpdateOwn: false })} />);
    expect(screen.getByText(/A Vállalások felülete jelenleg csak olvasható/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vállalások megnyitása" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Első vállalás rögzítése" })).not.toBeInTheDocument();
  });
});

describe("Riport és workshop átvezetése", () => {
  it("a jóváhagyott akcióterv olvasható pillanatkép, élő tömbszerkesztő nélkül", () => {
    render(<TeamReportView report={report()} isHu />);
    expect(screen.getByText("Eredeti, jóváhagyott értelmezés.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A riportban rögzített akcióterv" })).toBeInTheDocument();
    expect(screen.getByText(/Publikáláskori pillanatkép/)).toBeInTheDocument();
    const snapshot = document.querySelector("#report-actions")!;
    expect(within(snapshot as HTMLElement).getByText("A riport eredeti javaslata")).toBeInTheDocument();
    expect(within(snapshot as HTMLElement).getByText(/Felelős: Csapatvezető/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Vállalások megnyitása" }).every((link) => link.getAttribute("href") === "/team/team-1?tab=commitments")).toBe(true);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("a vázlat előnézete nem állít publikált vagy már átemelt vállalást", () => {
    render(<TeamReportView report={report({ status: "DRAFT", publishedAt: null })} isHu />);
    expect(screen.getByText(/Publikálás után a kiválasztott lépések külön emelhetők át/)).toBeInTheDocument();
    expect(screen.queryByText(/Publikáláskori pillanatkép/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Vállalások megnyitása" })).not.toBeInTheDocument();
  });

  it("saját profil nélkül is elérhető a tag közös vállalási felülete", () => {
    render(<TeamReportMemberView report={report()} viewer={null} isHu />);
    expect(screen.getByRole("link", { name: "Vállalások megnyitása" })).toHaveAttribute("href", "/team/team-1?tab=commitments");
  });

  it("a workshop ugyanahhoz az egyetlen élő felülethez vezet", () => {
    render(<TeamWorkshopFacilitatorView report={report()} isHu={false} />);
    const details = screen.getByText("90-minute team workshop").closest("details")!;
    details.open = true;
    expect(screen.getByRole("link", { name: "Open commitments" })).toHaveAttribute("href", "/team/team-1?tab=commitments");
  });
});
