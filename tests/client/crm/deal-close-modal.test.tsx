/**
 * Deal-lezárás client-tesztek (Vitest + RTL, a DealDetail-en át)
 *
 * A LOST-lezárás kényszerített outcomeKind-ja (kliens-oldali őr, a szerver
 * LOST_REASON_REQUIRED-je előtt), a sikeres close_lost payload, és a WON-
 * modal org-link figyelmeztetése.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DealDetail } from "@/components/admin/crm/DealDetail";
import type { CrmDealDetailData } from "@/components/admin/crm/types";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: refreshMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const domProps = Object.fromEntries(
        Object.entries(props).filter(
          ([key]) => !["initial", "animate", "exit", "transition", "whileHover", "whileTap"].includes(key),
        ),
      );
      return <div {...domProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const fetchMock = vi.fn();

function makeDeal(overrides: Partial<CrmDealDetailData> = {}): CrmDealDetailData {
  return {
    id: "deal1",
    title: "Acme Kft. — Demó igény",
    contactName: "Kovács Anna",
    contactEmail: "anna@acme.hu",
    contactPhone: "+36 30 123 4567",
    company: "Acme Kft.",
    stage: "QUOTED",
    source: "inquiry",
    expectedValue: 900_000,
    nextActionAt: null,
    nextActionNote: null,
    adminNote: null,
    outcomeKind: null,
    outcomeNote: null,
    closedAt: null,
    lastActivityAt: null,
    createdAt: "2026-07-20T10:00:00.000Z",
    organization: null,
    userProfile: null,
    activities: [],
    quotes: [],
    inquiries: [],
    newsletter: null,
    ...overrides,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  refreshMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ deal: { id: "deal1" } }) });
  vi.stubGlobal("fetch", fetchMock);
});

describe("DealDetail — lezárás", () => {
  it("LOST: outcomeKind nélkül kliens-oldali hibát ad, nem hív API-t", async () => {
    const user = userEvent.setup();
    render(<DealDetail deal={makeDeal()} orgs={[]} suggestedUser={null} />);

    await user.click(screen.getByRole("button", { name: "Elveszett" }));
    await user.click(await screen.findByTestId("crm-close-submit"));

    expect(await screen.findByTestId("crm-close-error")).toHaveTextContent(
      "Elveszett lezáráshoz kötelező okot választani.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("LOST: okkal close_lost megy a kiválasztott outcomeKind-dal", async () => {
    const user = userEvent.setup();
    render(<DealDetail deal={makeDeal()} orgs={[]} suggestedUser={null} />);

    await user.click(screen.getByRole("button", { name: "Elveszett" }));
    await user.selectOptions(await screen.findByTestId("crm-close-outcome-kind"), "price");
    await user.click(screen.getByTestId("crm-close-submit"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/crm/deals/deal1");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.action).toBe("close_lost");
    expect(body.outcomeKind).toBe("price");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("WON org-link nélkül: figyelmeztetés látszik, de a lezárás mehet ok nélkül is", async () => {
    const user = userEvent.setup();
    render(<DealDetail deal={makeDeal()} orgs={[]} suggestedUser={null} />);

    await user.click(screen.getByRole("button", { name: "Megnyert" }));
    expect(
      await screen.findByText(/Nincs szervezet linkelve/),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("crm-close-submit"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.action).toBe("close_won");
    expect("outcomeKind" in body).toBe(false);
  });
});
