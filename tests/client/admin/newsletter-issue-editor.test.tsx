/**
 * Szerkesztett hírlevél-szám — admin szerkesztő client-tesztek.
 *
 * A rögzített szerződés (2026-08-24): a szerkesztő munkamenete alatt NEM
 * futtatunk `router.refresh()`-t. A refresh újrarenderelte a szerver-fület,
 * ami elvesztette a nyitott szerkesztő állapotát: új szám mentése után a
 * felhasználó kiesett a szerkesztőből, így az előnézetig el sem jutott.
 * A frissítés a bezárásig várakozik, a lista addig helyben követi a mentést.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminNewsletterIssueSection } from "@/app/(app)/admin/_components/AdminNewsletterIssueSection";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: refreshMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const fetchMock = vi.fn();

const POSTS = [
  { slug: "elso-cikk", title: "Első cikk", locale: "hu" as const },
];

beforeEach(() => {
  fetchMock.mockReset();
  refreshMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

function respond(payload: Record<string, unknown>) {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => payload });
}

describe("AdminNewsletterIssueSection", () => {
  it("új szám mentése után a szerkesztő nyitva marad, és készíthető előnézet", async () => {
    const user = userEvent.setup();
    render(<AdminNewsletterIssueSection issues={[]} posts={POSTS} />);

    await user.click(screen.getByRole("button", { name: "Új szám" }));
    await user.type(screen.getByLabelText("Tárgy"), "Augusztusi szám");
    await user.type(screen.getByLabelText("Bevezető"), "Ebben a számban három írás.");

    respond({ ok: true, id: "issue-1" });
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    // A szerkesztő nyitva marad, és a mentés NEM futtat szerver-refresht.
    await screen.findByText(/Piszkozat mentve/);
    expect(screen.getByLabelText("Tárgy")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();

    // A mentett szám azonnal megjelenik a listában (helyi frissítés).
    expect(screen.getByText("Augusztusi szám")).toBeInTheDocument();

    respond({
      ok: true,
      html: "<p>előnézet</p>",
      previewHash: "a".repeat(64),
      recipients: 12,
      items: [{ title: "Első cikk" }],
    });
    await user.click(screen.getByRole("button", { name: "HTML-előnézet" }));

    await screen.findByTitle("Hírlevél HTML-előnézet");
    expect(screen.getAllByText(/12 hátralévő címzett/).length).toBeGreaterThan(0);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("a halasztott szerver-frissítés a szerkesztő bezárásakor fut le", async () => {
    const user = userEvent.setup();
    render(<AdminNewsletterIssueSection issues={[]} posts={POSTS} />);

    await user.click(screen.getByRole("button", { name: "Új szám" }));
    await user.type(screen.getByLabelText("Tárgy"), "Augusztusi szám");
    await user.type(screen.getByLabelText("Bevezető"), "Ebben a számban három írás.");

    respond({ ok: true, id: "issue-1" });
    await user.click(screen.getByRole("button", { name: "Mentés" }));
    await screen.findByText(/Piszkozat mentve/);

    await user.click(screen.getByRole("button", { name: "Bezárás" }));
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });
});
