/**
 * QuickLogForm client-tesztek (Vitest + RTL)
 *
 * A gyors-naplózó a napi CRM-flow magja: kind-pill váltás, mentés gombbal
 * és Cmd/Ctrl+Enterrel, mezők ürítése siker után, és a „következő lépés
 * ugyanabban a hívásban” payload-szemantika (jelenlét/null/hiány).
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickLogForm } from "@/components/admin/crm/QuickLogForm";
import { dayInputToIso } from "@/components/admin/crm/crm-ui";

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

function lastRequestBody(): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

beforeEach(() => {
  fetchMock.mockReset();
  refreshMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ activity: { id: "act1" }, deal: { id: "deal1" } }),
  });
  vi.stubGlobal("fetch", fetchMock);
});

describe("QuickLogForm", () => {
  it("kind-pill váltás után a kiválasztott kinddel ment, és ürít siker után", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<QuickLogForm dealId="deal1" onSaved={onSaved} />);

    // Alapértelmezett: CALL aktív
    expect(screen.getByTestId("quick-log-kind-CALL")).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByTestId("quick-log-kind-EMAIL_OUT"));
    expect(screen.getByTestId("quick-log-kind-EMAIL_OUT")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("quick-log-kind-CALL")).toHaveAttribute("aria-checked", "false");

    const summary = screen.getByTestId("quick-log-summary");
    await user.type(summary, "Ajánlat kiküldve emailben");
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("/api/admin/crm/deals/deal1/activities");
    const body = lastRequestBody();
    expect(body.kind).toBe("EMAIL_OUT");
    expect(body.summary).toBe("Ajánlat kiküldve emailben");
    // Következő lépés nélkül a kulcs HIÁNYZIK (a deal next actionje érintetlen)
    expect("nextActionAt" in body).toBe(false);

    await waitFor(() => expect(summary).toHaveValue(""));
    expect(refreshMock).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it("Ctrl+Enter bárhonnan ment; üres összefoglalóval nem küld", async () => {
    render(<QuickLogForm dealId="deal1" />);
    const form = screen.getByTestId("quick-log-form");

    // Üresen nem megy el
    fireEvent.keyDown(form, { key: "Enter", ctrlKey: true });
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("quick-log-summary"), {
      target: { value: "Hívás: érdeklődő, jövő héten dönt" },
    });
    fireEvent.keyDown(form, { key: "Enter", ctrlKey: true });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(lastRequestBody().kind).toBe("CALL");
  });

  it("a következő lépés dátummal + jegyzettel ugyanabban a POST-ban megy", async () => {
    const user = userEvent.setup();
    render(<QuickLogForm dealId="deal1" />);

    await user.click(screen.getByRole("button", { name: "Részletek és következő teendő" }));
    fireEvent.change(screen.getByTestId("quick-log-summary"), {
      target: { value: "Meeting megvolt" },
    });
    fireEvent.change(screen.getByTestId("quick-log-next-date"), {
      target: { value: "2026-08-12" },
    });
    fireEvent.change(screen.getByTestId("quick-log-next-note"), {
      target: { value: "Ajánlat összeállítása" },
    });
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = lastRequestBody();
    expect(body.nextActionAt).toBe(dayInputToIso("2026-08-12"));
    expect(body.nextActionNote).toBe("Ajánlat összeállítása");
  });

  it("„Kész”-módban (clearNextActionWhenEmpty) dátum nélkül nextActionAt: null megy", async () => {
    const user = userEvent.setup();
    render(<QuickLogForm dealId="deal1" nextActionOpenByDefault clearNextActionWhenEmpty />);

    fireEvent.change(screen.getByTestId("quick-log-summary"), {
      target: { value: "Lépés elintézve" },
    });
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = lastRequestBody();
    expect(body.nextActionAt).toBeNull();
  });

  it("szerver-hibakódot HU szövegként mutat, és nem ürít", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "DEAL_NOT_FOUND" }),
    });
    render(<QuickLogForm dealId="deal1" />);

    fireEvent.change(screen.getByTestId("quick-log-summary"), {
      target: { value: "Hívás" },
    });
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/nem található/i);
    expect(screen.getByTestId("quick-log-summary")).toHaveValue("Hívás");
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
