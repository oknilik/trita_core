import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TeamCommitment, TeamCommitmentsWorkspace } from "@/lib/team-commitments";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { TeamCommitments } from "@/components/team/TeamCommitments";

const item: TeamCommitment = {
  id: "own", title: "Kétperces lezárás", description: "A döntések követhetővé tétele.",
  nextStep: "Pénteken összefoglalni a vállalásokat.", successCriteria: "Két alkalommal kipróbáltuk.",
  ownerUserId: "anna", ownerName: "Anna", dueDate: "2026-12-20", status: "in_progress",
  latestNote: "Az első alkalom működött.", targetMetric: null, sourceReportId: "report", sourceReportTitle: "Szeptemberi riport",
  createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-11T10:00:00Z", version: 1,
  events: [{ id: "event", actorName: "Anna", createdAt: "2026-09-10T10:00:00Z", eventType: "UPDATED", status: "in_progress", note: "Az első alkalom működött." }],
};
const other: TeamCommitment = { ...item, id: "other", title: "Döntési felelős tisztázása", ownerName: "Márk", ownerUserId: "mark", status: "blocked" };
const legacy: TeamCommitment = { ...item, id: "legacy", title: "Név alapján örökölt vállalás", ownerUserId: null };
const workspace: TeamCommitmentsWorkspace = {
  teamId: "team", viewerId: "anna", perspective: "personal", canManage: false, canUpdateOwn: true,
  plan: { focus: "Tisztább döntések", nextCheckInDate: "2026-12-17", version: 1 },
  items: [other, item, legacy], assignees: [{ userId: "anna", name: "Anna" }, { userId: "mark", name: "Márk" }], suggestions: [],
};
const manager: TeamCommitmentsWorkspace = { ...workspace, viewerId: "manager", canManage: true, perspective: "team" };
const response = (fresh: TeamCommitmentsWorkspace) => new Response(JSON.stringify({ ok: true, workspace: fresh }));
const card = (title = item.title) => screen.getByRole("article", { name: title });
const openUpdate = (title = item.title, button = "Frissítek") => {
  fireEvent.click(within(card(title)).getByRole("button", { name: button }));
  return within(card(title)).getByRole("form", { name: "Frissítek" });
};

beforeEach(() => {
  refresh.mockClear();
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
});

describe("shared team commitments", () => {
  it("puts the member's own next step first and never grants ownership by matching names", () => {
    render(<TeamCommitments initialWorkspace={workspace} isHu />);
    expect(screen.getAllByRole("article").map((article) => article.id)).toEqual(["commitment-own", "commitment-other", "commitment-legacy"]);
    expect(within(card()).getByRole("button", { name: "Frissítek" })).toBeInTheDocument();
    expect(within(card(legacy.title)).queryByRole("button", { name: "Frissítek" })).not.toBeInTheDocument();
    expect(within(card(other.title)).queryByRole("button", { name: "Frissítek" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Új vállalás" })).not.toBeInTheDocument();
    expect(screen.getByText("3 aktív · 0 elkészült")).toBeInTheDocument();
  });

  it("keeps a read-only manager in the team perspective without mutation controls", () => {
    render(<TeamCommitments initialWorkspace={{ ...manager, canManage: false, canUpdateOwn: false }} isHu />);
    expect(screen.getByRole("heading", { name: "A csapat aktuális vállalásai" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "A te következő lépéseid" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Új vállalás" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Elakadás áttekintése" })).not.toBeInTheDocument();
  });

  it("requires a meaningful help note and saves only one owned item's status", async () => {
    vi.mocked(fetch).mockResolvedValue(response({ ...workspace, items: [{ ...item, status: "blocked", latestNote: "Vezetői döntés kell.", version: 2 }, other, legacy] }));
    render(<TeamCommitments initialWorkspace={workspace} isHu />);
    const form = openUpdate();
    fireEvent.click(within(form).getByRole("radio", { name: "Segítség kell" }));
    fireEvent.submit(form);
    expect(fetch).not.toHaveBeenCalled();
    expect(within(form).getByRole("alert")).toHaveTextContent("Írd le röviden");
    fireEvent.change(within(form).getByRole("textbox", { name: /Miben kérsz segítséget/ }), { target: { value: "Vezetői döntés kell." } });
    fireEvent.submit(form);
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    const options = vi.mocked(fetch).mock.calls[0][1];
    expect(options?.method).toBe("PATCH");
    expect(JSON.parse(String(options?.body))).toEqual({ action: "update", id: "own", expectedVersion: 1, status: "blocked", note: "Vezetői döntés kell." });
    expect(screen.getByText("A változás mentve. A csapat a friss állapotot látja.")).toBeInTheDocument();
  });

  it("preserves failed text through server refresh and a tab unmount/remount", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network"));
    const first = render(<TeamCommitments initialWorkspace={workspace} isHu />);
    const form = openUpdate();
    fireEvent.change(within(form).getByRole("textbox"), { target: { value: "Még nem mentett gondolat" } });
    fireEvent.submit(form);
    await within(form).findByRole("alert");
    first.rerender(<TeamCommitments initialWorkspace={{ ...workspace, items: [{ ...item, version: 2 }, other, legacy] }} isHu />);
    expect(within(form).getByRole("textbox")).toHaveValue("Még nem mentett gondolat");
    first.unmount();
    render(<TeamCommitments initialWorkspace={workspace} isHu />);
    const reopened = openUpdate();
    expect(within(reopened).getByRole("textbox")).toHaveValue("Még nem mentett gondolat");
  });

  it("loads conflicting server data beside the preserved draft and requires review before retry", async () => {
    const latest = { ...item, version: 2, latestNote: "Márk egyeztetést kért.", nextStep: "Új közös lépés" };
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "VERSION_CONFLICT" }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...workspace, items: [latest, other, legacy] })))
      .mockResolvedValueOnce(response({ ...workspace, items: [{ ...latest, version: 3, latestNote: "Saját gondolatom" }, other, legacy] }));
    render(<TeamCommitments initialWorkspace={workspace} isHu />);
    const form = openUpdate();
    fireEvent.change(within(form).getByRole("textbox"), { target: { value: "Saját gondolatom" } });
    fireEvent.submit(form);
    await within(form).findByRole("alert");
    expect(within(form).getByRole("button", { name: "Frissítés mentése" })).toBeDisabled();
    fireEvent.click(within(form).getByRole("button", { name: "Friss állapot betöltése" }));
    await within(form).findByText("Márk egyeztetést kért.");
    expect(within(form).getByRole("textbox")).toHaveValue("Saját gondolatom");
    expect(within(form).getByRole("button", { name: "Frissítés mentése" })).toBeDisabled();
    fireEvent.click(within(form).getByRole("checkbox", { name: "Összevetettem a friss állapotot a saját módosításommal." }));
    fireEvent.submit(form);
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[2][1]?.body))).toMatchObject({ expectedVersion: 2, note: "Saját gondolatom" });
  });

  it("does not remount another open card when a manager saves a different commitment", async () => {
    vi.mocked(fetch).mockResolvedValue(response({ ...manager, items: [{ ...other, version: 2 }, item, legacy] }));
    render(<TeamCommitments initialWorkspace={manager} isHu />);
    const firstForm = openUpdate(item.title, "Állapot frissítése");
    fireEvent.change(within(firstForm).getByRole("textbox"), { target: { value: "Anna nyitott piszkozata" } });
    const otherForm = openUpdate(other.title, "Elakadás áttekintése");
    fireEvent.change(within(otherForm).getByRole("textbox"), { target: { value: "Szervezem a segítséget" } });
    fireEvent.submit(otherForm);
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(within(firstForm).getByRole("textbox")).toHaveValue("Anna nyitott piszkozata");
    expect(firstForm.isConnected).toBe(true);
  });

  it("shows the actual note author after a later manager edit and renders event history", () => {
    const withEdit = { ...item, events: [{ id: "edit", eventType: "EDITED", actorName: "Vezető", createdAt: "2026-09-11T12:00:00Z", status: "in_progress" as const, note: null }, ...item.events] };
    render(<TeamCommitments initialWorkspace={{ ...workspace, items: [withEdit] }} isHu />);
    fireEvent.click(within(card()).getByRole("button", { name: "Részletek és előzmények" }));
    expect(within(card()).getByText("Legutóbbi jelzés · Anna")).toBeInTheDocument();
    expect(within(card()).queryByText("Legutóbbi jelzés · Vezető")).not.toBeInTheDocument();
    fireEvent.click(within(card()).getByText("Előzmények · 2"));
    expect(within(card()).getByText("Vezető · Vállalás pontosítva")).toBeInTheDocument();
    expect(within(card()).getByText("Anna · Állapotjelzés")).toBeInTheDocument();
  });

  it("creates a commitment with a real assignee and keeps the agreed date separate from check-in", async () => {
    vi.mocked(fetch).mockResolvedValue(response({ ...manager, items: [...manager.items, { ...item, id: "new", title: "Új közös próba" }] }));
    render(<TeamCommitments initialWorkspace={manager} isHu />);
    fireEvent.click(screen.getByRole("button", { name: "Új vállalás" }));
    const form = screen.getByRole("form", { name: "Új vállalás" });
    fireEvent.change(within(form).getByRole("textbox", { name: "Mit vállalunk?" }), { target: { value: "Új közös próba" } });
    fireEvent.change(within(form).getByRole("combobox", { name: "Felelős kiválasztása" }), { target: { value: "mark" } });
    fireEvent.change(within(form).getByLabelText("Vállalt időpont"), { target: { value: "2026-12-20" } });
    fireEvent.submit(form);
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ action: "create", fields: { title: "Új közös próba", ownerUserId: "mark", dueDate: "2026-12-20", description: "", nextStep: "", successCriteria: "" } });
  });

  it("does not present the person importing a report as the original note author", () => {
    const imported = { ...item, events: [{ ...item.events[0], eventType: "IMPORTED", actorName: "Importáló vezető" }] };
    render(<TeamCommitments initialWorkspace={{ ...workspace, items: [imported] }} isHu />);
    fireEvent.click(within(card()).getByRole("button", { name: "Részletek és előzmények" }));
    expect(within(card()).getByText("Legutóbbi jelzés")).toBeInTheDocument();
    expect(within(card()).queryByText("Legutóbbi jelzés · Importáló vezető")).not.toBeInTheDocument();
    fireEvent.click(within(card()).getByText("Előzmények · 1"));
    expect(within(card()).getByText("Átvett riportmegjegyzés; az eredeti szerző nincs rögzítve.")).toBeInTheDocument();
  });

  it("imports four selected suggestions without treating the 1–3 recommendation as a limit", async () => {
    const suggestions = Array.from({ length: 4 }, (_, index) => ({ reportId: "report", reportTitle: "Szeptemberi riport", sourceActionKey: String(index), title: `Javaslat ${index}`, description: "Közös próba", ownerName: null, dueDate: null, status: "not_started" as const }));
    vi.mocked(fetch).mockResolvedValue(response(manager));
    render(<TeamCommitments initialWorkspace={{ ...manager, suggestions }} isHu />);
    fireEvent.click(screen.getByText("Javaslatok a közzétett riportokból · 4"));
    screen.getAllByRole("checkbox").forEach((checkbox) => fireEvent.click(checkbox));
    fireEvent.click(screen.getByRole("button", { name: "Kiválasztottak átvétele (4)" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ action: "import", items: suggestions.map(({ reportId, sourceActionKey }) => ({ reportId, sourceActionKey })) });
  });

  it("saves focus and check-in with their own version", async () => {
    vi.mocked(fetch).mockResolvedValue(response({ ...manager, plan: { focus: "Új fókusz", nextCheckInDate: "2026-12-18", version: 2 } }));
    render(<TeamCommitments initialWorkspace={manager} isHu />);
    fireEvent.click(screen.getByRole("button", { name: "Fókusz és egyeztetés" }));
    const form = screen.getByRole("form", { name: "Fókusz és egyeztetés" });
    fireEvent.change(within(form).getByRole("textbox", { name: "A csapat aktuális fókusza" }), { target: { value: "Új fókusz" } });
    fireEvent.change(within(form).getByLabelText("Következő közös egyeztetés"), { target: { value: "2026-12-18" } });
    fireEvent.submit(form);
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ action: "plan", expectedVersion: 1, focus: "Új fókusz", nextCheckInDate: "2026-12-18" });
  });

  it("provides searchable completed history and English interface labels", () => {
    render(<TeamCommitments initialWorkspace={{ ...workspace, items: [{ ...item, status: "done" }, { ...other, status: "done" }] }} isHu={false} />);
    expect(screen.getByRole("heading", { name: "Our shared commitments" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Completed commitments · 2"));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search completed commitments" }), { target: { value: "Kétperces" } });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(card()).toBeInTheDocument();
  });

  it("ignores corrupted stored draft fields without crashing or dropping current data", () => {
    sessionStorage.setItem("trita:commitment-draft:anna:team:own:update", JSON.stringify({ status: "in_progress", note: null, version: 1 }));
    render(<TeamCommitments initialWorkspace={workspace} isHu />);
    const form = openUpdate();
    expect(within(form).getByRole("textbox")).toHaveValue("");
  });
});
