/**
 * CrmTodayPanel client-tesztek (Vitest + RTL)
 *
 * A „Ma” panel a napi hurok belépője: üres állapot (tanító szöveggel),
 * halasztó chipek dátum-számítása (UTC nap + preset, jegyzet-megőrzéssel),
 * és a „Kész” modal → gyors-naplózó „Kész”-módban.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrmTodayPanel } from "@/components/admin/crm/CrmTodayPanel";
import { computePostponeAt } from "@/components/admin/crm/crm-ui";
import type { CrmDealRow } from "@/components/admin/crm/types";

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

function makeDeal(overrides: Partial<CrmDealRow> = {}): CrmDealRow {
  return {
    id: "deal1",
    title: "Acme Kft. – Demó igény",
    company: "Acme Kft.",
    contactName: "Kovács Anna",
    contactEmail: "anna@acme.hu",
    contactPhone: null,
    stage: "DISCOVERY",
    source: "inquiry",
    expectedValue: 900_000,
    nextActionAt: "2026-08-01T09:00:00.000Z",
    nextActionNote: "Follow-up hívás az ajánlatról",
    lastActivityAt: "2026-07-30T10:00:00.000Z",
    closedAt: null,
    outcomeKind: null,
    outcomeNote: null,
    createdAt: "2026-07-20T10:00:00.000Z",
    quotes: [],
    inquiryCount: 1,
    newsletter: null,
    activityCount: 3,
    ...overrides,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  refreshMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ deal: { id: "deal1" } }) });
  vi.stubGlobal("fetch", fetchMock);
});

describe("CrmTodayPanel", () => {
  it("üres állapot: tanító szöveg, nincs sor", () => {
    render(<CrmTodayPanel deals={[]} />);
    expect(screen.getByTestId("crm-today-empty")).toHaveTextContent(
      "Minden esedékes lépés megvan mára.",
    );
    expect(screen.queryByTestId("crm-today-row")).not.toBeInTheDocument();
  });

  it("halasztó chip: set_next_action a helyes (+N nap) dátummal, jegyzet-megőrzéssel", async () => {
    const user = userEvent.setup();
    render(<CrmTodayPanel deals={[makeDeal()]} />);

    await user.click(screen.getByTestId("crm-postpone-3"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/crm/deals/deal1");
    expect(init.method).toBe("PATCH");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.action).toBe("set_next_action");
    // A chip a MAI naptól számol (UTC nap-határ) — nem a lejárt dátumtól.
    expect(body.at).toBe(computePostponeAt(3));
    expect(body.note).toBe("Follow-up hívás az ajánlatról");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("lejárt lépés error-chipet kap; a „Kész” a gyors-naplózó modalt nyitja", async () => {
    const user = userEvent.setup();
    render(<CrmTodayPanel deals={[makeDeal()]} />);

    // A fixture-dátum a múltban van → lejárt
    expect(screen.getByText(/Lejárt ·/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Elintézve" }));
    expect(await screen.findByTestId("quick-log-form")).toBeInTheDocument();

    // „Kész”-mód: dátum nélkül a mentés törli az elintézett next actiont
    fireEvent.change(screen.getByTestId("quick-log-summary"), {
      target: { value: "Hívás megvolt, dönt jövő héten" },
    });
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/crm/deals/deal1/activities");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.nextActionAt).toBeNull();
  });
});
