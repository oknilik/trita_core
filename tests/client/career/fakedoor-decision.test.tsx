/**
 * Fake door döntési panel (Vitest + RTL)
 *
 * Amit ez a fájl véd, az nem a látvány, hanem a MÉRÉS épsége:
 *  · a döntés azonnal mentődik, még a követő kérdés előtt — aki ott
 *    elnavigál, annak a legfontosabb jelzése akkor is megvan;
 *  · az átugrás is válasz (`skipped`), különben a megoszlás azok felé
 *    torzulna, akik hajlandóak voltak még egy kérdésre felelni;
 *  · a két gomb egyenrangú — ha a „nem" halkabb lenne, a minta felfelé
 *    torzulna, és a mérés önbecsapás lenne.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecisionPanel } from "@/components/career/fakedoor/DecisionPanel";
import { t } from "@/lib/i18n";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

const SESSION = "11111111-2222-3333-4444-555555555555";

function bodies(): Record<string, unknown>[] {
  const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  return fetchMock.mock.calls.map(
    (call: unknown[]) => JSON.parse((call[1] as RequestInit).body as string) as Record<string, unknown>,
  );
}

describe("fake door döntési panel", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }))) as never;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderPanel() {
    return render(
      <DecisionPanel
        sessionId={SESSION}
        source="results"
        priceVariant={9900}
        defaultEmail={null}
        initial={null}
      />,
    );
  }

  it("a döntést azonnal menti, még a követő kérdés előtt", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: t("fakeDoor.no", "hu") }));

    await waitFor(() => expect(bodies()).toHaveLength(1));
    expect(bodies()[0]).toMatchObject({
      sessionId: SESSION,
      source: "results",
      interest: "no",
    });
    // A követő kérdés csak ezután jelenik meg.
    expect(screen.getByText(t("fakeDoor.reasonTitle", "hu"))).toBeTruthy();
  });

  it("az átugrás is rögzül — mindkét ágon", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: t("fakeDoor.yes", "hu") }));
    await screen.findByText(t("fakeDoor.goalTitle", "hu"));
    await user.click(screen.getByRole("button", { name: t("fakeDoor.skip", "hu") }));

    await waitFor(() => expect(bodies()).toHaveLength(2));
    expect(bodies()[1]).toMatchObject({ interest: "yes", valueGoal: "skipped" });
  });

  it("a választott ok a saját ágán megy el, a másik ág mezője nélkül", async () => {
    const user = userEvent.setup();
    const { container } = renderPanel();

    await user.click(screen.getByRole("button", { name: t("fakeDoor.no", "hu") }));
    await screen.findByText(t("fakeDoor.reasonTitle", "hu"));

    // Érték szerint keresünk, nem felirat szerint: a felirat i18n-változásra
    // törne, az érték viszont maga a mért kategória.
    const accuracy = container.querySelector<HTMLInputElement>('input[value="accuracy"]');
    expect(accuracy).not.toBeNull();
    await user.click(accuracy as HTMLInputElement);
    await user.click(screen.getByRole("button", { name: t("fakeDoor.submit", "hu") }));

    await waitFor(() => expect(bodies()).toHaveLength(2));
    expect(bodies()[1]).toMatchObject({ interest: "no", reasonNo: "accuracy" });
    expect(bodies()[1].valueGoal).toBeUndefined();
  });

  it("az e-mail csak bejelölt opt-innel megy el", async () => {
    const user = userEvent.setup();
    render(
      <DecisionPanel
        sessionId={SESSION}
        source="direct"
        priceVariant={9900}
        defaultEmail="valaki@pelda.hu"
        initial={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: t("fakeDoor.yes", "hu") }));
    await screen.findByText(t("fakeDoor.goalTitle", "hu"));
    // Az e-mail elő van töltve, de opt-in nélkül NEM kerül el: a kényelmi
    // előtöltés nem hozzájárulás.
    await user.click(screen.getByRole("button", { name: t("fakeDoor.skip", "hu") }));

    await waitFor(() => expect(bodies()).toHaveLength(2));
    expect(bodies()[1].email).toBeUndefined();
    expect(bodies()[1].emailOptIn).toBeUndefined();
  });

  it("az ár-ok mellé az összeg is elmegy, más okhoz viszont nem", async () => {
    const user = userEvent.setup();
    const { container } = renderPanel();

    await user.click(screen.getByRole("button", { name: t("fakeDoor.no", "hu") }));
    await screen.findByText(t("fakeDoor.reasonTitle", "hu"));

    // Más ok: csúszka sincs, összeg sem megy el.
    await user.click(container.querySelector<HTMLInputElement>('input[value="no_need"]') as HTMLInputElement);
    expect(container.querySelector('input[type="range"]')).toBeNull();

    await user.click(container.querySelector<HTMLInputElement>('input[value="price"]') as HTMLInputElement);
    const slider = container.querySelector<HTMLInputElement>('input[type="range"]');
    expect(slider).not.toBeNull();
    // A csúszka a LÁTOTT árról indul, és nem mehet fölé.
    expect(slider?.value).toBe("9900");
    expect(slider?.max).toBe("9900");
    expect(slider?.min).toBe("0");
    // A lépésköznek osztania kell a látott árat, különben a böngésző a
    // megnyitáskor lecsúsztatja a csúszkát a rács legközelebbi pontjára —
    // vagyis a kiindulópont már egy le nem adott engedmény lenne.
    expect(Number(slider?.max) % Number(slider?.step)).toBe(0);

    await user.click(screen.getByRole("button", { name: t("fakeDoor.submit", "hu") }));
    await waitFor(() => expect(bodies()).toHaveLength(2));
    expect(bodies()[1]).toMatchObject({ reasonNo: "price", maxPriceHuf: 9900 });
  });

  it("korábbi válasszal nem kérdez újra", () => {
    render(
      <DecisionPanel
        sessionId={SESSION}
        source="direct"
        priceVariant={9900}
        defaultEmail={null}
        initial={{ interest: "yes", valueGoal: "fit", reasonNo: null, emailOptIn: false }}
      />,
    );

    expect(screen.getByText(t("fakeDoor.thanksTitle", "hu"))).toBeTruthy();
    expect(screen.queryByRole("button", { name: t("fakeDoor.yes", "hu") })).toBeNull();
  });
});
