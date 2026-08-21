import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewsletterEngagementBadge } from "@/components/admin/crm/NewsletterEngagementBadge";

describe("NewsletterEngagementBadge", () => {
  it("nem feliratkozonal semmit nem rajzol", () => {
    const { container } = render(<NewsletterEngagementBadge engagement={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("aktiv olvasonal a feliratkozas honapjat es a kattintasokat mutatja", () => {
    render(
      <NewsletterEngagementBadge
        engagement={{
          status: "ACTIVE",
          confirmedAt: "2026-03-14T10:00:00.000Z",
          source: "blog_post",
          accepted: 6,
          delivered: 5,
          linkRequests: 4,
        }}
      />,
    );

    expect(screen.getByText(/Olvasó/)).toBeInTheDocument();
    expect(screen.getByText(/4\/6 linkkérés/)).toBeInTheDocument();
  });

  // A leiratkozott állapot is információ: megelőzi a kínos „nem kaptad meg a
  // hírlevelünket?" kérdést a tanácsadói hívás elején.
  it("a leiratkozott allapotot kiirja, nem rejti el", () => {
    render(
      <NewsletterEngagementBadge
        engagement={{
          status: "UNSUBSCRIBED",
          confirmedAt: "2026-03-14T10:00:00.000Z",
          source: "footer",
          accepted: 2,
          delivered: 2,
          linkRequests: 0,
        }}
      />,
    );

    expect(screen.getByText(/Leiratkozott/)).toBeInTheDocument();
  });
});
