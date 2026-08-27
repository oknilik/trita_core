import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingClient } from "@/app/(app)/onboarding/OnboardingClient";

const { completeMock, toastMock } = vi.hoisted(() => ({
  completeMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

describe("OnboardingClient – claim aktiválás", () => {
  beforeEach(() => {
    completeMock.mockReset();
    toastMock.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  it("csak a nevet és a hozzájárulást kéri, majd az eredmény útjára ad át", async () => {
    const user = userEvent.setup();
    render(<OnboardingClient variant="claim" onComplete={completeMock} />);

    expect(screen.getByRole("heading", { name: "Az eredményed készen áll" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Születési év")).not.toBeInTheDocument();
    expect(screen.queryByText("Nem")).not.toBeInTheDocument();
    expect(screen.queryByText("Ország")).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Hogy szólíthatunk?" }), "Anna");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Megnézem az eredményem" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;

    expect(body.username).toBe("Anna");
    expect(body.consentedAt).toEqual(expect.any(String));
    expect(body).not.toHaveProperty("birthYear");
    expect(body).not.toHaveProperty("gender");
    expect(body).not.toHaveProperty("country");
    expect(completeMock).toHaveBeenCalledOnce();
  });

  it("a normál onboarding teljes adatköre megmarad", () => {
    render(<OnboardingClient variant="full" />);

    expect(screen.getByRole("heading", { name: "Személyes adatok" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Születési év" })).toBeInTheDocument();
    expect(screen.getByText("Nem")).toBeInTheDocument();
    expect(screen.getByText("Ország")).toBeInTheDocument();
  });
});
