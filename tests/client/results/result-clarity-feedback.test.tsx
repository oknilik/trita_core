import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultClarityFeedback } from "@/components/results/ResultClarityFeedback";

describe("ResultClarityFeedback", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("egyetlen választ ment, majd köszönő állapotot mutat", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<ResultClarityFeedback initialSubmitted={false} locale="hu" />);
    fireEvent.click(screen.getByRole("button", { name: "Igen" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/feedback/result-clarity",
      expect.objectContaining({ body: JSON.stringify({ rating: 5 }) }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Köszönjük");
  });

  it("korábbi válasznál nem kérdez újra", () => {
    render(<ResultClarityFeedback initialSubmitted locale="hu" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
