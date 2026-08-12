/**
 * ShareModal client integration tests (Vitest + RTL)
 *
 * Covers the progressive disclosure flow: deferred link creation, accessible
 * dialog semantics, clipboard feedback, optional email sending, and confirmed
 * revocation of an existing share.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareModal } from "@/components/results/ShareModal";
import { t } from "@/lib/i18n";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({
    locale: "en",
    setLocale: vi.fn(),
    isChanging: false,
  }),
}));

// framer-motion AnimatePresence a jsdom alatt is renderel, de a portál +
// animáció determinisztikusabb mockolva.
vi.mock("framer-motion", () => {
  // Komponens-cache: property-hozzáférésenként azonos referencia, különben
  // minden render remountolná a modal-részfát (fókuszvesztés az inputban).
  const cache = new Map<string, React.ComponentType<{ children?: React.ReactNode }>>();
  return {
    motion: new Proxy({}, {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          const Comp = ({ children, ...rest }: { children?: React.ReactNode }) => {
            const dom = { ...(rest as Record<string, unknown>) };
            for (const k of ["initial", "animate", "exit", "transition"]) delete dom[k];
            const Tag = tag as keyof React.JSX.IntrinsicElements;
            return <Tag {...dom}>{children}</Tag>;
          };
          cache.set(tag, Comp);
        }
        return cache.get(tag);
      },
    }),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockShareCreate(token = "tok123") {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url === "/api/profile/share" && (!init || init.method === "POST")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ token }) });
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

describe("ShareModal", () => {
  it("opens as an accessible, inactive dialog without creating a share", async () => {
    mockShareCreate();
    render(<ShareModal isOpen onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: t("content.shareModalTitle", "en") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("common.close", "en") })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: t("content.shareCreateAndCopy", "en") }),
    ).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(t("content.shareRevoke", "en"))).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText(t("content.shareEmailQrHint", "en"))).not.toBeInTheDocument();
  });

  it("creates the link on first copy and copies it with inline feedback, no alert", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockShareCreate();
    render(<ShareModal isOpen onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: t("content.shareCreateAndCopy", "en") }),
    );

    // Az első másolás hozza létre a linket…
    expect(fetchMock).toHaveBeenCalledWith("/api/profile/share", { method: "POST" });
    await waitFor(() => {
      expect(screen.getByDisplayValue(/\/share\/tok123$/)).toBeInTheDocument();
    });
    // …és rögtön a vágólapra is kerül (userEvent clipboard-stub).
    await expect(navigator.clipboard.readText()).resolves.toMatch(/\/share\/tok123$/);
    expect(await screen.findByText(t("content.shareCopied", "en"))).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("reveals email on demand and confirms the recipient and QR attachment", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/profile/share/send") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, token: "mailtok" }),
        });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    render(<ShareModal isOpen onClose={vi.fn()} />);

    expect(screen.queryByPlaceholderText(t("content.shareEmailPlaceholder", "en"))).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t("content.shareEmailToggle", "en") }));
    await user.type(
      screen.getByPlaceholderText(t("content.shareEmailPlaceholder", "en")),
      "friend@example.com",
    );
    await user.click(screen.getByRole("button", { name: t("content.shareEmailSend", "en") }));

    expect(await screen.findByText(/Sent to:/)).toHaveTextContent("friend@example.com");
    expect(screen.getByText(t("content.shareEmailQrHint", "en"))).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\/share\/mailtok$/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile/share/send",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "friend@example.com" }),
      }),
    );
    // Kliens-oldali link-létrehozás nem történt.
    expect(fetchMock).not.toHaveBeenCalledWith("/api/profile/share", { method: "POST" });
  });

  it("rejects an invalid email locally without calling the API", async () => {
    const user = userEvent.setup();
    mockShareCreate();
    render(<ShareModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: t("content.shareEmailToggle", "en") }));
    await user.type(
      screen.getByPlaceholderText(t("content.shareEmailPlaceholder", "en")),
      "not-an-email",
    );
    await user.click(screen.getByRole("button", { name: t("content.shareEmailSend", "en") }));

    expect(await screen.findByText(t("content.shareEmailInvalid", "en"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires confirmation before revoking an existing share, then offers a new one", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/profile/share" && init?.method === "DELETE") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      if (url === "/api/profile/share") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: "tok123" }) });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    render(<ShareModal isOpen initialToken="oldtok" onClose={vi.fn()} />);

    expect(screen.getByDisplayValue(/\/share\/oldtok$/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t("content.shareManage", "en") }));
    await user.click(screen.getByRole("button", { name: t("content.shareRevoke", "en") }));
    expect(screen.getByText(t("content.shareRevokeConfirmTitle", "en"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: t("content.shareRevokeConfirm", "en") }),
    );

    expect(await screen.findByText(t("content.shareRevoked", "en"))).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/profile/share", { method: "DELETE" });

    // Új link létrehozása visszavonás után
    await user.click(screen.getByRole("button", { name: t("content.shareCreateNew", "en") }));
    expect(await screen.findByDisplayValue(/\/share\/tok123$/)).toBeInTheDocument();
  });

  it("keeps the generated link visible when email delivery fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "SEND_FAILED", token: "kepttok" }),
    });
    render(<ShareModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: t("content.shareEmailToggle", "en") }));
    await user.type(
      screen.getByPlaceholderText(t("content.shareEmailPlaceholder", "en")),
      "friend@example.com",
    );
    await user.click(screen.getByRole("button", { name: t("content.shareEmailSend", "en") }));

    expect(await screen.findByText(t("content.shareEmailError", "en"))).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\/share\/kepttok$/)).toBeInTheDocument();
  });
});
