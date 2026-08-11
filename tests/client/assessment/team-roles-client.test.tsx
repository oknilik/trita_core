/**
 * Csapatszerep self-beküldő (Vitest + RTL) — motor-audit v6, 7. javítás.
 *
 * Amit ez a fájl véd: a ~4 perces kitöltés nem veszhet el némán. A korábbi
 * kliens a fetch eredményétől függetlenül átirányított („redirect
 * regardless") — a 400/403/hálózati hiba a kitöltést nyomtalanul eldobta.
 * Az új viselkedés a peer-kliens (TeamRolePeersClient) mintája: hibánál
 * hibaképernyő, a válaszok megőrzésével és újrapróbálással.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeamRolesClient } from "@/app/(app)/assessment/team-roles/TeamRolesClient";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { t } from "@/lib/i18n";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// A kérdőív maga nem tárgya a tesztnek (27 itemes flow) — a stub egyetlen
// gombbal hívja az onComplete-et rögzített kitöltéssel.
const STUB_SELECTIONS = { 1: 2, 2: 1, 3: 1 };
vi.mock("@/components/assessment/TeamRoleQuestionnaire", () => ({
  TeamRoleQuestionnaire: ({
    onComplete,
    submitting,
  }: {
    onComplete: (selections: Record<number, number>) => void;
    submitting?: boolean;
  }) => (
    <button
      type="button"
      disabled={submitting}
      onClick={() => onComplete(STUB_SELECTIONS)}
    >
      kitöltés-stub
    </button>
  ),
}));

function fetchBodies(): Record<string, unknown>[] {
  const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  return fetchMock.mock.calls.map(
    (call: unknown[]) =>
      JSON.parse((call[1] as RequestInit).body as string) as Record<string, unknown>,
  );
}

describe("csapatszerep self-beküldő", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sikeres beküldés után a journey-elosztóra visz", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ) as never;
    const user = userEvent.setup();
    render(<TeamRolesClient locale="hu" />);

    await user.click(screen.getByRole("button", { name: "kitöltés-stub" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(JOURNEY_HOME_HANDOFF_PATH));
    expect(fetchBodies()[0]).toMatchObject({ selections: STUB_SELECTIONS });
  });

  it("4xx válasznál NEM navigál el — hibaképernyőt mutat", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "INVALID_INPUT" }), { status: 400 }),
    ) as never;
    const user = userEvent.setup();
    render(<TeamRolesClient locale="hu" />);

    await user.click(screen.getByRole("button", { name: "kitöltés-stub" }));

    expect(await screen.findByText(t("teamRole.errorTitle", "hu"))).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("hálózati hibánál a megőrzött kitöltés újrapróbálható, sikernél átirányít", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    globalThis.fetch = fetchMock as never;
    const user = userEvent.setup();
    render(<TeamRolesClient locale="hu" />);

    await user.click(screen.getByRole("button", { name: "kitöltés-stub" }));
    expect(await screen.findByText(t("teamRole.errorTitle", "hu"))).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: t("teamRole.retry", "hu") }),
    );

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(JOURNEY_HOME_HANDOFF_PATH));
    // A második hívás UGYANAZT a kitöltést küldi — nem veszett el.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchBodies()[1]).toMatchObject({ selections: STUB_SELECTIONS });
  });

  it("a hibaágon a kihagyás is elérhető marad (opcionális lépés)", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 403 }),
    ) as never;
    const user = userEvent.setup();
    render(<TeamRolesClient locale="hu" />);

    await user.click(screen.getByRole("button", { name: "kitöltés-stub" }));
    await screen.findByText(t("teamRole.errorTitle", "hu"));

    await user.click(screen.getByRole("button", { name: t("teamRole.skip", "hu") }));
    expect(pushMock).toHaveBeenCalledWith(JOURNEY_HOME_HANDOFF_PATH);
  });
});
