import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ProfileSummary,
  buildProfileSummaryInsights,
} from "@/components/results/ProfileSummary";
import type { SerializedDimension } from "@/components/profile/ProfileTabs";

const DIMENSIONS: SerializedDimension[] = [
  { code: "H", label: "Becsületesség-Alázat", color: "#000", score: 82, insight: "Erős értékrend.", description: "Következetes döntések.", insights: { low: "", mid: "", high: "" }, facets: [] },
  { code: "E", label: "Emocionalitás", color: "#000", score: 50, insight: "Nyugodt jelenlét.", description: "Higgadt helyzetkezelés.", insights: { low: "", mid: "", high: "" }, facets: [] },
  { code: "X", label: "Extraverzió", color: "#000", score: 66, insight: "Kapcsolódó jelenlét.", description: "Aktív csapatmunka.", insights: { low: "", mid: "", high: "" }, facets: [] },
  { code: "A", label: "Barátságosság", color: "#000", score: 31, insight: "Egyenes vitahelyzetek.", description: "Határozott kommunikáció.", insights: { low: "", mid: "", high: "" }, facets: [] },
  { code: "C", label: "Lelkiismeretesség", color: "#000", score: 60, insight: "Rendezett működés.", description: "Megbízható végrehajtás.", insights: { low: "", mid: "", high: "" }, facets: [] },
  { code: "O", label: "Nyitottság", color: "#000", score: 74, insight: "Új nézőpontokat keresel.", description: "Ötletgazdag munka.", insights: { low: "", mid: "", high: "" }, facets: [] },
];

describe("ProfileSummary", () => {
  it("három külön olvasási kapaszkodót állít elő", () => {
    const insights = buildProfileSummaryInsights(DIMENSIONS, undefined, "hu");
    expect(insights.map((item) => item.label)).toEqual([
      "Ami természetesen megy",
      "Ami több figyelmet kérhet",
      "Munkahelyen ez számít",
    ]);
    expect(insights[0].text).toBe("Erős értékrend.");
    expect(insights[1].text).toBe("Egyenes vitahelyzetek.");
  });

  it("a rövid nézetben számok helyett szintcímkéket és egy részletező CTA-t mutat", async () => {
    const onOpenDetails = vi.fn();
    render(
      <ProfileSummary
        dimensions={DIMENSIONS}
        sentInvitations={[]}
        observerCount={0}
        hasObserverData={false}
        onOpenDetails={onOpenDetails}
        onOpenComparison={vi.fn()}
        locale="hu"
      />,
    );

    expect(screen.getByRole("heading", { name: "Ezt érdemes elvinned az eredményedből." })).toBeInTheDocument();
    expect(screen.getAllByRole("meter")).toHaveLength(6);
    expect(document.body.textContent).not.toContain("82%");

    await userEvent.click(screen.getByRole("button", { name: /Részletes riport megnyitása/ }));
    expect(onOpenDetails).toHaveBeenCalledOnce();
  });
});
