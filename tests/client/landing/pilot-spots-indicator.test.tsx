import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { PilotSpotsIndicator } from "@/components/marketing/PilotSpotsIndicator";
import { track } from "@/lib/analytics/client";

const capacity = vi.hoisted(() => ({ total: 20, left: 17 }));
vi.mock("@/lib/pilot-config", () => ({
  get PILOT_TOTAL_TEAMS() { return capacity.total; },
  get PILOT_SPOTS_LEFT() { return capacity.left; },
}));
vi.mock("@/lib/analytics/client", () => ({ track: vi.fn() }));

beforeEach(() => { capacity.total = 20; capacity.left = 17; });

it.each(["hu", "en"] as const)("shows joined capacity and accessible values in %s", async (locale) => {
  render(<PilotSpotsIndicator locale={locale} href="/pilot" ctaId="test-pilot" surface="team" />);
  const link = screen.getByRole("link", { name: locale === "hu" ? /Részletek:.*17/ : /Details:.*17/ });
  const bar = screen.getByRole("progressbar", { name: locale === "hu" ? "Csatlakozott csapatok" : "Teams joined" });
  expect(bar).toHaveAttribute("aria-valuemin", "0");
  expect(bar).toHaveAttribute("aria-valuemax", "20");
  expect(bar).toHaveAttribute("aria-valuenow", "3");
  expect(bar).toHaveAttribute("aria-valuetext", locale === "hu" ? "3 csapat csatlakozott a 20 helyből" : "3 of 20 team spots taken");
  expect(bar.firstElementChild).toHaveStyle({ width: "15%" });
  expect(screen.getByText(locale === "hu" ? "3 csapat már csatlakozott" : "Teams already joined: 3")).toBeVisible();
  expect(screen.getByText(locale === "hu" ? "20 hely összesen" : "20 spots in total")).toBeVisible();
  expect(link).toHaveAttribute("href", "/pilot");
  const user = userEvent.setup();
  await user.tab();
  expect(link).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(track).toHaveBeenCalledWith("cta.click", { cta_id: "test-pilot", surface: "team" });
});

it.each([[30, 12, 18, "60%"], [20, 20, 0, "0%"]])("derives the bar and labels from capacity %i / %i", (total, left, taken, width) => {
  capacity.total = Number(total); capacity.left = Number(left);
  render(<PilotSpotsIndicator locale="en" href="/pilot" ctaId="test" surface="pricing" />);
  const bar = screen.getByRole("progressbar");
  expect(bar).toHaveAttribute("aria-valuemax", String(total));
  expect(bar).toHaveAttribute("aria-valuenow", String(taken));
  expect(bar.firstElementChild).toHaveStyle({ width });
  expect(screen.getByText(String(left))).toBeVisible();
});

it("preserves the sold-out behavior", () => {
  capacity.left = 0;
  const { container } = render(<PilotSpotsIndicator locale="en" href="/pilot" ctaId="test" surface="pilot" />);
  expect(container).toBeEmptyDOMElement();
});
