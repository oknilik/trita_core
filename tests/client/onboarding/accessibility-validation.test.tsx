import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

beforeEach(() => {
  completeMock.mockReset();
  toastMock.mockReset();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
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

describe("OnboardingClient accessibility and validation", () => {
  it("keeps every required-field error visible until that field is corrected", async () => {
    vi.useFakeTimers();
    render(<OnboardingClient variant="full" onComplete={completeMock} />);

    fireEvent.click(screen.getByRole("button", { name: "Tovább a teszthez" }));

    const username = screen.getByRole("textbox", { name: "Hogy szólíthatunk?" });
    const birthYear = screen.getByRole("spinbutton", { name: "Születési év" });
    const genderGroup = screen.getByRole("radiogroup", { name: "Nem" });
    const country = screen.getByRole("group", { name: "Ország" });
    const consent = screen.getByRole("checkbox");

    expect(username).toHaveAttribute("aria-invalid", "true");
    expect(birthYear).toHaveAttribute("aria-invalid", "true");
    expect(genderGroup).toHaveAttribute("aria-invalid", "true");
    expect(country).toHaveAttribute("aria-invalid", "true");
    expect(consent).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("A névnek 2-20 karakter hosszúnak kell lennie")).toBeInTheDocument();
    expect(screen.getByText("Az életkornak 16-100 év közé kell esnie")).toBeInTheDocument();
    expect(screen.getByText("Válassz egy lehetőséget")).toBeInTheDocument();
    expect(screen.getByText("Válassz országot")).toBeInTheDocument();
    expect(screen.getByText("A folytatáshoz fogadd el az adatvédelmi tájékoztatót")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });

    expect(screen.getByText("Válassz egy lehetőséget")).toBeInTheDocument();
    expect(screen.getByText("Válassz országot")).toBeInTheDocument();
    expect(screen.getByText("A folytatáshoz fogadd el az adatvédelmi tájékoztatót")).toBeInTheDocument();

    fireEvent.change(username, { target: { value: "Anna" } });
    expect(username).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("A névnek 2-20 karakter hosszúnak kell lennie")).not.toBeInTheDocument();
    expect(screen.getByText("Válassz országot")).toBeInTheDocument();
  });

  it("submits a valid form when Enter is pressed in a field", async () => {
    const user = userEvent.setup();
    render(<OnboardingClient variant="claim" onComplete={completeMock} />);

    const username = screen.getByRole("textbox", { name: "Hogy szólíthatunk?" });
    await user.type(username, "Anna");
    await user.click(screen.getByRole("checkbox"));
    await user.type(username, "{Enter}");

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(completeMock).toHaveBeenCalledOnce();
  });

  it("implements roving focus and arrow/Home/End selection for the gender radiogroup", () => {
    render(<OnboardingClient variant="full" onComplete={completeMock} />);

    const group = screen.getByRole("radiogroup", { name: "Nem" });
    const male = screen.getByRole("radio", { name: "Férfi" });
    const female = screen.getByRole("radio", { name: "Nő" });
    const preferNot = screen.getByRole("radio", { name: "Nem válaszolok" });

    expect(group).toBeInTheDocument();
    expect(male).toHaveAttribute("tabindex", "0");
    expect(female).toHaveAttribute("tabindex", "-1");

    male.focus();
    fireEvent.keyDown(male, { key: "ArrowRight" });
    expect(female).toHaveFocus();
    expect(female).toHaveAttribute("aria-checked", "true");
    expect(female).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(female, { key: "End" });
    expect(preferNot).toHaveFocus();
    expect(preferNot).toHaveAttribute("aria-checked", "true");

    fireEvent.keyDown(preferNot, { key: "Home" });
    expect(male).toHaveFocus();
    expect(male).toHaveAttribute("aria-checked", "true");
  });
});
