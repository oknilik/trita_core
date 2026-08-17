import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider, useLocale } from "@/components/LocaleProvider";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function LocaleProbe() {
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button type="button" onClick={() => setLocale("en")}>English</button>
    </div>
  );
}

describe("LocaleProvider — magyar alapállapot", () => {
  beforeEach(() => {
    refresh.mockClear();
    window.localStorage.clear();
    window.sessionStorage.clear();
    document.cookie = "trita_locale=; path=/; max-age=0";
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["en-US", "en"],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({ locale: null }),
    }));
  });

  it("angol böngészőből érkezve is magyar marad, amíg a user nem vált", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("hu");
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByTestId("locale")).toHaveTextContent("hu");
    expect(window.localStorage.getItem("trita_locale")).toBeNull();

    await user.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(window.localStorage.getItem("trita_locale")).toBe("en");
  });
});
