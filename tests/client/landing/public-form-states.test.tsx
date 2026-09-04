import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/app/(marketing)/contact/ContactForm";
import { PilotContent } from "@/app/(marketing)/pilot/PilotContent";
import { PricingQuickAsk } from "@/components/pricing/PricingQuickAsk";
import { t } from "@/lib/i18n/public";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const localeMock = vi.hoisted(() => ({ value: "hu" as "hu" | "en" }));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: localeMock.value, setLocale: vi.fn() }),
}));

vi.mock("@/lib/analytics/client", () => ({ track: vi.fn() }));

function pendingResponse() {
  let resolve!: (response: { ok: boolean; status: number }) => void;
  const promise = new Promise<{ ok: boolean; status: number }>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function expectUniqueIds(controls: HTMLElement[]) {
  const ids = controls.map((control) => control.id);
  expect(ids.every(Boolean)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
}

describe("public form state contracts", () => {
  beforeEach(() => {
    localeMock.value = "hu";
  });

  it("kiemeli a következő pilot-helyet a brand-csillagos kapacitáskártyán", () => {
    const { container } = render(<PilotContent />);

    const capacity = container.querySelector("[data-pilot-spots]");
    const nextSpot = container.querySelector('[data-pilot-spot="next"]');
    expect(capacity).not.toBeNull();
    const capacityUi = within(capacity as HTMLElement);
    expect(capacityUi.getByText("szabad partnercsapat-hely")).toBeInTheDocument();
    expect(capacityUi.getByText("3 hely már foglalt · a következő lehet a tiétek")).toBeInTheDocument();
    expect(nextSpot).toHaveAttribute("data-pilot-spot-effect", "star-arrival");
    expect(container.querySelectorAll('[data-pilot-spot="taken"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-pilot-spot="open"]')).toHaveLength(6);
  });

  it("validates the Hungarian contact form, submits with Enter, retains an API error, then retries", async () => {
    const user = userEvent.setup();
    const pending = pendingResponse();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm locale="hu" />);

    const name = screen.getByRole("textbox", { name: t("contact.name", "hu") });
    const email = screen.getByRole("textbox", { name: t("contact.email", "hu") });
    const company = screen.getByRole("textbox", { name: t("contact.company", "hu") });
    const topic = screen.getByRole("combobox", { name: t("contact.topic", "hu") });
    const message = screen.getByRole("textbox", { name: t("contact.message", "hu") });
    expectUniqueIds([name, email, company, topic, message]);

    const submit = screen.getByRole("button", { name: t("contact.submit", "hu") });
    await user.click(submit);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Adj meg egy legalább 2 karakteres nevet.")).toBeInTheDocument();
    expect(submit).not.toBeDisabled();

    await user.type(name, "Teszt Elek");
    await user.type(email, "teszt@example.com");
    await user.type(company, "Tesztes Kft.");
    await user.type(message, "Ez egy kellően hosszú tesztüzenet a csapatnak.");
    await user.click(email);
    await user.keyboard("{Enter}");

    await waitFor(() => expect(name).toBeDisabled());
    expect(email).toBeDisabled();
    expect(company).toBeDisabled();
    expect(topic).toBeDisabled();
    expect(message).toBeDisabled();

    await act(async () => pending.resolve({ ok: false, status: 500 }));

    expect(await screen.findByRole("alert")).toHaveTextContent(t("contact.errorGeneric", "hu"));
    expect(name).toHaveValue("Teszt Elek");
    expect(email).toHaveValue("teszt@example.com");
    expect(company).toHaveValue("Tesztes Kft.");
    expect(message).toHaveValue("Ez egy kellően hosszú tesztüzenet a csapatnak.");
    expect(name).not.toBeDisabled();
    await waitFor(() => expect(submit).toHaveFocus());

    await user.keyboard("{Enter}");
    expect(await screen.findByRole("status")).toHaveTextContent(t("contact.successTitle", "hu"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("validates the English pilot form, announces API failure and succeeds on keyboard retry", async () => {
    localeMock.value = "en";
    const user = userEvent.setup();
    const pending = pendingResponse();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    render(<PilotContent />);

    const name = screen.getByRole("textbox", { name: t("pilot.labelName", "en") });
    const email = screen.getByRole("textbox", { name: t("pilot.labelEmail", "en") });
    const company = screen.getByRole("textbox", { name: t("pilot.labelCompany", "en") });
    const size = screen.getByRole("combobox", { name: t("pilot.labelSize", "en") });
    const message = screen.getByRole("textbox", { name: t("pilot.labelQuestion", "en") });
    expectUniqueIds([name, email, company, size, message]);

    const submit = screen.getByRole("button", { name: t("pilot.submitDefault", "en") });
    await user.click(submit);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a name between 2 and 100 characters.")).toBeInTheDocument();
    expect(submit).not.toBeDisabled();

    await user.type(name, "Pilot Paula");
    await user.type(email, "pilot@example.com");
    await user.type(company, "Pilot Kft.");
    await user.selectOptions(size, "11-25");
    await user.type(message, "A csapat együttműködésére vagyunk kíváncsiak.");
    await user.click(email);
    await user.keyboard("{Enter}");

    await waitFor(() => expect(name).toBeDisabled());
    expect(email).toBeDisabled();
    expect(company).toBeDisabled();
    expect(size).toBeDisabled();
    expect(message).toBeDisabled();

    await act(async () => pending.resolve({ ok: false, status: 500 }));

    expect(await screen.findByRole("alert")).toHaveTextContent(t("pilot.errorMessage", "en"));
    expect(name).toHaveValue("Pilot Paula");
    expect(email).toHaveValue("pilot@example.com");
    expect(company).toHaveValue("Pilot Kft.");
    expect(size).toHaveValue("11-25");
    expect(message).toHaveValue("A csapat együttműködésére vagyunk kíváncsiak.");
    expect(name).not.toBeDisabled();
    await waitFor(() => expect(submit).toHaveFocus());

    await user.keyboard("{Enter}");
    expect(await screen.findByRole("status")).toHaveTextContent(t("pilot.successTitle", "en"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("the pricing question has persistent labels and an announced error without clearing data", async () => {
    const user = userEvent.setup();
    const pending = pendingResponse();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending.promise));
    render(<PricingQuickAsk locale="hu" />);

    const name = screen.getByLabelText(t("pricing.quickAskName", "hu"));
    const email = screen.getByLabelText(t("pricing.quickAskEmail", "hu"));
    const message = screen.getByLabelText(t("contact.message", "hu"));
    expectUniqueIds([name, email, message]);

    const submit = screen.getByRole("button", { name: t("pricing.quickAskSend", "hu") });
    await user.click(submit);
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Adj meg egy legalább 2 karakteres nevet.")).toBeInTheDocument();
    expect(submit).not.toBeDisabled();

    await user.type(name, "Kérdező Kata");
    await user.type(email, "kata@example.com");
    await user.type(message, "Szeretnénk egy rövid pilotprogramot a csapatnak.");
    await user.click(email);
    await user.keyboard("{Enter}");

    await waitFor(() => expect(name).toBeDisabled());
    expect(email).toBeDisabled();
    expect(message).toBeDisabled();

    await act(async () => pending.resolve({ ok: false, status: 500 }));

    expect(await screen.findByRole("alert")).toHaveTextContent(t("pricing.quickAskError", "hu"));
    expect(name).toHaveValue("Kérdező Kata");
    expect(email).toHaveValue("kata@example.com");
    expect(message).toHaveValue("Szeretnénk egy rövid pilotprogramot a csapatnak.");
    expect(name).not.toBeDisabled();
    await waitFor(() => expect(submit).toHaveFocus());
  });
});
