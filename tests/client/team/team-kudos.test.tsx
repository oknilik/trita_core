import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeamKudos } from "@/components/team/TeamKudos";

const members = [
  { userId: "me", displayName: "Dániel" },
  { userId: "reka", displayName: "Aurora Réka" },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TeamKudos", () => {
  it("a csapattal megosztott kudost külön csapatfolyamban mutatja", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          meId: "me",
          items: [],
          teamItems: [
            {
              id: "kudos-1",
              direction: "sent",
              fromName: "Dániel",
              toName: "Aurora Réka",
              message: "Köszönöm a tegnapi segítséget.",
              emoji: "🙌",
              teamVisible: true,
              canHideFromTeam: true,
              createdAt: "2026-08-25T10:00:00.000Z",
            },
          ],
        }),
      ),
    );

    const user = userEvent.setup();
    render(<TeamKudos teamId="team-1" members={members} locale="hu" />);

    await user.click(await screen.findByRole("button", { name: "Csapat elismerései" }));

    expect(screen.getByText("Dániel → Aurora Réka")).toBeInTheDocument();
    expect(screen.getByText("„Köszönöm a tegnapi segítséget.”")).toBeInTheDocument();
    expect(screen.getByText("a csapat is látja")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Elrejtés a csapat elől" })).toBeInTheDocument();
  });

  it("csak tudatos választás után küldi csapatszintűként a kudost", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return jsonResponse({ ok: true, id: "kudos-2" }, 201);
      return jsonResponse({ meId: "me", items: [], teamItems: [] });
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<TeamKudos teamId="team-1" members={members} locale="hu" />);

    await screen.findByText("Kapott köszöneteid (0)");
    expect(screen.getByRole("radio", { name: /Csak a címzett/ })).toBeChecked();
    await user.selectOptions(screen.getByRole("combobox"), "reka");
    await user.type(screen.getByRole("textbox"), "Köszönöm a segítséget!");
    await user.click(screen.getByRole("radio", { name: /Az egész csapat/ }));
    await user.click(screen.getByRole("button", { name: "Köszönet küldése" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/team/team-1/kudos",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(postCall).toBeDefined();
    expect(JSON.parse(String(postCall?.[1]?.body))).toMatchObject({
      toUserId: "reka",
      shareWithTeam: true,
    });
  });

  it("a küldő vagy címzett elrejtheti a kudost a csapatfolyamból", async () => {
    const teamItem = {
      id: "kudos-hide",
      direction: "received",
      fromName: "Aurora Réka",
      toName: "Dániel",
      message: "Köszönöm a támogatást.",
      emoji: "🙏",
      teamVisible: true,
      canHideFromTeam: true,
      createdAt: "2026-08-25T10:00:00.000Z",
    };
    let hidden = false;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        hidden = true;
        return jsonResponse({ ok: true });
      }
      return jsonResponse({
        meId: "me",
        items: [teamItem],
        teamItems: hidden ? [] : [teamItem],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<TeamKudos teamId="team-1" members={members} locale="hu" />);

    await user.click(await screen.findByRole("button", { name: "Csapat elismerései" }));
    await user.click(screen.getByRole("button", { name: "Elrejtés a csapat elől" }));

    await waitFor(() => {
      expect(screen.getByText("Még nincs a csapattal megosztott köszönet.")).toBeInTheDocument();
    });
    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
      itemId: "kudos-hide",
      action: "hideFromTeam",
    });
  });
});
