import { DEFAULT_RATE_CARD } from "@/lib/quote/rate-card";
import { formatMoneyParts } from "@/lib/pricing/fx";
import { derivePublicLadder, pilotPerHead } from "@/lib/pricing/team-ladder";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactContent } from "@/app/(marketing)/contact/ContactContent";
import { PricingPageContent } from "@/app/(marketing)/pricing/PricingPageContent";
import { t } from "@/lib/i18n/public";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu" as const, setLocale: vi.fn() }),
}));

vi.mock("@/lib/analytics/client", () => ({ track: vi.fn() }));

const ladder = derivePublicLadder(DEFAULT_RATE_CARD);
// A nagy szám pénznem NÉLKÜL jelenik meg (a pénznem külön elem): a
// formázást ugyanaz a modul adja, mint a felületen.
const hufAmount = (value: number) => formatMoneyParts(value, "hu", ladder.fx).amount;
const plain = (value: string) => value.replace(/ /g, " ");

describe("the separate contact and pricing art directions", () => {
  it("keeps every contact intent visible and uses the signal-response motif", () => {
    const { container } = render(<ContactContent />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${t("contact.title", "hu")} ${t("contact.titleEm", "hu")}`,
    );
    expect(container.querySelector("[data-contact-signal-art]")).not.toBeNull();
    expect(container.querySelector("[data-contact-topics]")).not.toBeNull();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(
      screen
        .getAllByRole("link", { name: /hello@trita\.io/ })
        .every((link) => link.getAttribute("href") === "mailto:hello@trita.io"),
    ).toBe(true);
  });

  it("the pricing page opens with the two levels, carries the calculator and routes the closing decision to contact", () => {
    const { container } = render(<PricingPageContent ladder={ladder} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${t("pricing.pageTitle", "hu")}${t("pricing.pageTitleEm", "hu")}`,
    );

    // A két szint csempéje a díjkártya áraival.
    const tiles = container.querySelector("[data-pricing-tiles]") as HTMLElement;
    expect(within(tiles).getByText(plain(hufAmount(ladder.tiers.kep.perHead)))).toBeInTheDocument();
    expect(within(tiles).getByText(plain(hufAmount(ladder.tiers.prog.perHead)))).toBeInTheDocument();

    // Kalkulátor a horgonnyal, összehasonlító tábla, pilot-ár.
    expect(container.querySelector("#kalkulator")).not.toBeNull();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    const pilot = container.querySelector("[data-pricing-pilot]") as HTMLElement;
    expect(within(pilot).getByText(plain(hufAmount(pilotPerHead(ladder, "prog"))))).toBeInTheDocument();
    // A pilot-sáv a szabad helyek jelzőjével visz a /pilot oldalra.
    expect(pilot.querySelector("[data-pilot-spots]")).toHaveAttribute("href", "/pilot");

    // Csak az árról szóló GYIK; a program-GYIK a csapat-oldalon.
    expect(screen.getByText("Mennyibe kerül?")).toBeInTheDocument();
    expect(screen.queryByText("Hogyan indul az együttműködés?")).not.toBeInTheDocument();

    expect(screen.queryByLabelText(t("pricing.quickAskName", "hu"))).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: t("pricing.bottomCta", "hu") })).toHaveAttribute("href", "/contact");
    expect(container.querySelectorAll("[data-testid='page-width-divider']")).toHaveLength(1);
  });
});
