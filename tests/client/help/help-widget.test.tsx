import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HelpWidget } from "@/components/help/HelpWidget";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile/results",
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/components/auth/auth-state", () => ({
  useAuthState: () => ({ isSignedIn: true }),
}));

vi.mock("@/lib/analytics/client", () => ({ track }));

describe("HelpWidget", () => {
  beforeEach(() => track.mockClear());

  it("az aktuális oldalhoz kapcsolódó gyors válaszokat mutat", () => {
    render(<HelpWidget audience="member" />);

    fireEvent.click(screen.getByRole("button", { name: "Segítség megnyitása" }));

    expect(screen.getByRole("dialog", { name: "Miben segíthetünk?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hol találom az eredményeimet?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mit mutat az összehasonlítás?" })).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith("help.open", {
      audience: "member",
      surface: "profile",
    });
  });

  it("a trita bemutatását magyarul a jóváhagyott szöveggel jeleníti meg", () => {
    render(<HelpWidget audience="public" />);
    fireEvent.click(screen.getByRole("button", { name: "Segítség megnyitása" }));
    fireEvent.click(screen.getByRole("button", { name: "Mi is az a trita és kinek tud segíteni?" }));

    expect(screen.getByText(/Egyéni szinten ingyenes önismereti eszköz/)).toBeInTheDocument();
  });

  it("az ingyenes egyéni felmérés aktuális ígéretét jeleníti meg", () => {
    render(<HelpWidget audience="public" />);
    fireEvent.click(screen.getByRole("button", { name: "Segítség megnyitása" }));
    fireEvent.click(screen.getByRole("button", { name: "Kipróbálhatom ingyen?" }));

    expect(screen.getByText(/8–10 percet vesz igénybe/)).toBeInTheDocument();
    expect(screen.getByText(/teljes személyiségképet/)).toBeInTheDocument();
  });

  it("a személyiségteszt működését az aktuális szöveggel magyarázza el", () => {
    render(<HelpWidget audience="public" />);
    fireEvent.click(screen.getByRole("button", { name: "Segítség megnyitása" }));
    fireEvent.click(screen.getByRole("button", { name: "Hogyan működik a személyiségteszt?" }));

    expect(screen.getByText(/hat személyiségdimenziót mér/)).toBeInTheDocument();
    expect(screen.getByText(/külső kép összevethetővé válik/)).toBeInTheDocument();
  });

  it("a csapatfolyamat teljes tartalmát és a workshopos folytatást mutatja", () => {
    render(<HelpWidget audience="public" />);
    fireEvent.click(screen.getByRole("button", { name: "Segítség megnyitása" }));
    fireEvent.click(screen.getByRole("button", { name: /Csapatoknak és cégeknek/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mit kap egy csapat?" }));

    expect(screen.getByText(/pszichológiai biztonságot vizsgálunk/)).toBeInTheDocument();
    expect(screen.getByText(/dolgozunk tovább a workshopokon/)).toBeInTheDocument();
  });

  it("a pilotprogram kedvezményes, core csapattal közös lehetőségét bemutatja", () => {
    render(<HelpWidget audience="public" />);
    fireEvent.click(screen.getByRole("button", { name: "Segítség megnyitása" }));
    fireEvent.click(screen.getByRole("button", { name: /Csapatoknak és cégeknek/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mi a pilotprogram, és hogyan csatlakozhatunk?" }));

    expect(screen.getByText(/cégeknek kínál kedvezményes lehetőséget/)).toBeInTheDocument();
    expect(screen.getByText(/trita core csapatával/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Megnézem a pilotprogramot" })).toHaveAttribute("href", "/pilot");
  });

  it("ékezetfüggetlenül keres, és strukturált választ nyit", () => {
    render(<HelpWidget audience="member" />);
    fireEvent.click(screen.getByRole("button", { name: "Segítség megnyitása" }));

    fireEvent.change(screen.getByRole("searchbox", { name: "Keresés a segítségben" }), {
      target: { value: "meghivo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Hogyan kérek visszajelzést/ }));

    expect(screen.getByText(/Külső kép fülén/)).toBeInTheDocument();
    expect(screen.getByText("Nyisd meg az Eredményeim oldal Külső kép fülét.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Meghívók kezelése" })).toHaveAttribute(
      "href",
      "/profile/results?tab=comparison#invitations",
    );
  });

  it("visszajelzést rögzít, Escape-re bezár és visszaadja a fókuszt", async () => {
    render(<HelpWidget audience="member" />);
    const launcher = screen.getByRole("button", { name: "Segítség megnyitása" });
    launcher.focus();
    fireEvent.click(launcher);
    fireEvent.click(screen.getByRole("button", { name: "Hol találom az eredményeimet?" }));

    fireEvent.click(screen.getByRole("button", { name: "Igen" }));
    expect(screen.getByRole("button", { name: "Igen" })).toHaveAttribute("aria-pressed", "true");
    expect(track).toHaveBeenCalledWith("help.answer_feedback", {
      entry_id: "where-results",
      helpful: true,
      surface: "profile",
    });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(launcher).toHaveFocus());
  });
});
