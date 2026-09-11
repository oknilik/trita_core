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
      "Ezt próbáld ki",
    ]);
    expect(insights[0].text).toBe("Erős értékrend.");
    expect(insights[1].text).toBe("Egyenes vitahelyzetek.");
  });

  it("a részletes eredményt korán, a személyes következő lépést a páros ajánló előtt mutatja", async () => {
    const onOpenDetails = vi.fn();
    const onOpenComparison = vi.fn();
    render(
      <ProfileSummary dimensions={DIMENSIONS} sentInvitations={[]} observerCount={0} hasObserverData={false}
        bridgeNextStep={{ stage: "TEAM_READY", explanation: "Olvasd át a csapatod publikált összegzését.", primary: { label: "Csapatom eredménye", href: "/team/example" } }}
        interactionEntry={{ state: "new" }} personalityType="Újító" clarityFeedbackSubmitted
        onOpenDetails={onOpenDetails} onOpenComparison={onOpenComparison} locale="hu" />,
    );
    const details = screen.getByRole("button", { name: "Részletes eredményem" });
    const firstInsight = screen.getByRole("heading", { name: "Ami természetesen megy" });
    const nextStep = screen.getByRole("link", { name: "Csapatom eredménye" });
    const pair = screen.getByRole("heading", { name: "Mi történik, amikor két profil találkozik?" });
    expect(details.compareDocumentPosition(firstInsight) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(firstInsight.compareDocumentPosition(nextStep) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nextStep.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    await userEvent.click(details);
    await userEvent.click(screen.getByRole("button", { name: "Külső nézőpont" }));
    expect(onOpenDetails).toHaveBeenCalledOnce();
    expect(onOpenComparison).toHaveBeenCalledOnce();
  });

  it("a rövid nézetben csak az értelmezést és két egyértelmű továbblépést mutat", async () => {
    const onOpenDetails = vi.fn();
    render(
      <ProfileSummary
        dimensions={DIMENSIONS}
        sentInvitations={[]}
        observerCount={0}
        hasObserverData={false}
        interactionEntry={{ state: "new" }}
        personalityType="Újító"
        clarityFeedbackSubmitted={false}
        onOpenDetails={onOpenDetails}
        onOpenComparison={vi.fn()}
        locale="hu"
      />,
    );

    expect(screen.getByRole("heading", { name: "Ezt érdemes elvinned az eredményedből." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mi történik, amikor két profil találkozik?" })).toBeInTheDocument();
    expect(screen.queryAllByRole("meter")).toHaveLength(0);
    expect(document.body.textContent).not.toContain("82%");
    expect(screen.getByRole("button", { name: /Külső nézőpont/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Részletes eredményem/ }));
    expect(onOpenDetails).toHaveBeenCalledOnce();
  });
});
