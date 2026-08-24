import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { t } from "@/lib/i18n";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const localeMock = vi.hoisted(() => ({ value: "hu" as "hu" | "en" }));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: localeMock.value, setLocale: vi.fn() }),
}));

// Az analitika nem tárgya ennek a tesztnek, de a hívása nem törhet el semmit.
vi.mock("@/lib/analytics/client", () => ({ track: vi.fn() }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

beforeEach(() => {
  localeMock.value = "hu";
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

    const email = screen.getByLabelText(/email/i);
    await userEvent.type(email, "olvaso@example.com");
    await userEvent.click(screen.getByRole("button", { name: t("newsletter.submit", "hu") }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(t("newsletter.errorRateLimited", "hu"));
    });
    expect(email).toHaveValue("olvaso@example.com");
    expect(email.id).not.toBe("");
  });

  it("inverse feluleten eros inverse szinnel jelzi a hibat", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    render(<NewsletterForm source="footer" variant="inline" onInverse />);

    const email = screen.getByLabelText(/email/i);
    await userEvent.type(email, "olvaso@example.com");
    await userEvent.click(screen.getByRole("button", { name: t("newsletter.submit", "hu") }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveStyle({ color: "var(--color-text-on-inverse)" });
    expect(email.getAttribute("style")).toContain(
      "border-color: var(--color-state-error-solid)",
    );
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

  it("tobb peldany eseten is egyedi, labellel osszekotott mezoket ad", () => {
    render(
      <>
        <NewsletterForm source="footer" variant="inline" />
        <NewsletterForm source="blog_index" variant="compact" />
      </>,
    );

    const fields = screen.getAllByLabelText(t("newsletter.emailLabel", "hu"));
    expect(fields).toHaveLength(2);
    expect(fields[0].id).not.toBe("");
    expect(fields[1].id).not.toBe("");
    expect(fields[0].id).not.toBe(fields[1].id);
  });

  it("English validation focuses the email, then Enter retries after an API error", async () => {
    localeMock.value = "en";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<NewsletterForm source="blog_index" />);

    const email = screen.getByRole("textbox", { name: t("newsletter.emailLabel", "en") });
    const submit = screen.getByRole("button", { name: t("newsletter.submit", "en") });
    await user.click(submit);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(t("newsletter.errorInvalid", "en"));
    expect(submit).not.toBeDisabled();

    await user.type(email, "reader@example.com");
    expect(email).not.toHaveAttribute("aria-invalid", "true");
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("newsletter.errorRateLimited", "en"),
    );
    expect(email).toHaveValue("reader@example.com");
    await waitFor(() => expect(submit).toHaveFocus());

    await user.keyboard("{Enter}");
    expect(await screen.findByRole("status")).toHaveTextContent(
      t("newsletter.successTitle", "en"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
