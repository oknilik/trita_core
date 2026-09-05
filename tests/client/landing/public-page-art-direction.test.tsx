import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactContent } from "@/app/(marketing)/contact/ContactContent";
import { PricingContent } from "@/app/(marketing)/pricing/PricingContent";
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

describe("the separate contact and collaboration art directions", () => {
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

  it("uses the shared-rhythm motif and routes the closing decision to contact", () => {
    const { container } = render(<PricingContent />);

    expect(container.querySelector("[data-collaboration-rhythm-art]")).not.toBeNull();
    expect(screen.queryByText("Tisztább csapatkép")).not.toBeInTheDocument();
    expect(screen.queryByText("Külön nézőpontok · közös kép")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(t("pricing.quickAskName", "hu"))).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: t("pricing.bottomCta", "hu") })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("link", { name: t("pricing.heroProcessCta", "hu") })).toHaveAttribute(
      "href",
      "#workflow",
    );
    expect(screen.getByRole("heading", { name: t("pricing.pilotSectionTitle", "hu") })).toBeInTheDocument();
    expect(container.querySelector("[data-pilot-spots]")).toHaveAttribute("href", "/pilot");
    expect(container.querySelectorAll("[data-testid='page-width-divider']")).toHaveLength(1);
  });
});
