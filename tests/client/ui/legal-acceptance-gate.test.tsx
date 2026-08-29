import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LegalAcceptanceGate } from "@/components/legal/LegalAcceptanceGate";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const pending = {
  campaignId: "cm12345678901234567890123",
  platformTermsVersion: "PFF-v2",
  privacyNoticeVersion: "PRIVACY-v2",
  effectiveAt: "2026-08-29T00:00:00.000Z",
};

afterEach(() => {
  vi.restoreAllMocks();
  refresh.mockReset();
});

describe("LegalAcceptanceGate", () => {
  it("nem renderel kaput, ha nincs aktív elfogadási kérés", () => {
    render(<LegalAcceptanceGate pending={null} locale="hu" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("csak kifejezett elfogadás után rögzít és frissít", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    render(<LegalAcceptanceGate pending={pending} locale="hu" />);

    const submit = screen.getByRole("button", { name: "Elfogadom és folytatom" });
    expect(submit).toBeDisabled();
    expect(screen.getByRole("link", { name: /Platform ÁSZF/ })).toHaveAttribute(
      "href",
      "/legal/platform-terms",
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/legal/acceptance",
      expect.objectContaining({ method: "POST" }),
    ));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
