import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrustPeersClient } from "@/app/(app)/assessment/trust/TrustPeersClient";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const teammates = [
  { userId: "done-1", name: "Aurora Réka", done: true },
  { userId: "peter", name: "Aurora Péter", done: false },
  { userId: "zsofia", name: "Aurora Zsófia", done: false },
];

describe("TrustPeersClient", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("kiemelt személyfókusszal tartja láthatóan az aktuális kollégát", async () => {
    const user = userEvent.setup();
    render(
      <TrustPeersClient
        locale="hu"
        campaignId="campaign-1"
        campaignName="Csapatdinamika"
        teammates={teammates}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Elkezdem" }));

    expect(screen.getByText("Most róla válaszolsz")).toBeInTheDocument();
    expect(screen.getByText("Aurora Péter")).toBeInTheDocument();
    expect(screen.getByText("A következő kérdések mind rá vonatkoznak.")).toBeInTheDocument();
    expect(screen.getByText("2 / 3 · aktuális kolléga")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "0 / 5 válasz" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    await user.click(screen.getAllByRole("button", { name: "5" })[0]);

    expect(screen.getByRole("progressbar", { name: "1 / 5 válasz" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(screen.getByText("Megválaszolva")).toBeInTheDocument();
  });
});
