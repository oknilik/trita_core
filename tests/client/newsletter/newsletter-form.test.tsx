import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { t } from "@/lib/i18n";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu" as const, setLocale: vi.fn() }),
}));

// Az analitika nem tárgya ennek a tesztnek, de a hívása nem törhet el semmit.
vi.mock("@/lib/analytics/client", () => ({ track: vi.fn() }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("NewsletterForm", () => {
  it("sikeres bekuldes utan a megerosites-kero uzenetet mutatja", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    render(<NewsletterForm source="blog_post" />);

    await userEvent.type(screen.getByLabelText(/email/i), "olvaso@example.com");
    await userEvent.click(screen.getByRole("button", { name: t("newsletter.submit", "hu") }));

    await waitFor(() => {
      expect(screen.getByText(t("newsletter.successTitle", "hu"))).toBeInTheDocument();
    });

    // A siker-üzenet SZÁNDÉKOSAN nem árulja el, hogy a cím már fent volt-e:
    // a szerver sem teszi, itt sem szabad kiszivárogtatni.
    expect(screen.getByText(t("newsletter.successBody", "hu"))).toBeInTheDocument();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/newsletter/subscribe");
    expect(JSON.parse(String(init.body))).toMatchObject({
      email: "olvaso@example.com",
      source: "blog_post",
      locale: "hu",
    });
  });

  it("a 429-et sajat, ertheto uzenette forditja", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    render(<NewsletterForm source="footer" variant="inline" />);

    await userEvent.type(screen.getByLabelText(/email/i), "olvaso@example.com");
    await userEvent.click(screen.getByRole("button", { name: t("newsletter.submit", "hu") }));

    await waitFor(() => {
      expect(screen.getByText(t("newsletter.errorRateLimited", "hu"))).toBeInTheDocument();
    });
  });

  it("halozati hiba eseten sem marad beragadva a gomb", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<NewsletterForm source="blog_index" />);

    await userEvent.type(screen.getByLabelText(/email/i), "olvaso@example.com");
    const submit = screen.getByRole("button", { name: t("newsletter.submit", "hu") });
    await userEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText(t("newsletter.errorGeneric", "hu"))).toBeInTheDocument();
    });
    expect(submit).not.toBeDisabled();
  });
});
