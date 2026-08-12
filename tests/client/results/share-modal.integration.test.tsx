/**
 * ShareModal client integration tests (Vitest + RTL)
 *
 * Covers the progressive disclosure flow: deferred link creation, accessible
 * dialog semantics, clipboard feedback, compact secondary actions, LinkedIn
 * sharing, optional email sending, and confirmed revocation.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareModal } from "@/components/results/ShareModal";
import { t } from "@/lib/i18n";

vi.mock("@/components/results/ShareCardDownload", async () => {
  const React = await import("react");
  return {
    ShareCardDownload: React.forwardRef(function MockShareCardDownload(
      _props: unknown,
      ref: React.ForwardedRef<{ buildPngBlob: () => Promise<Blob> }>,
    ) {
      React.useImperativeHandle(ref, () => ({
        buildPngBlob: async () => new Blob(["image"], { type: "image/png" }),
      }));
      return <button type="button" aria-label="Download card as image">Image</button>;
    }),
  };
});

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

const preview = {
  userName: "Alex",
  personalityType: "Innovator",
  topDims: [{ label: "Openness", score: 82 }],
  glyphDimensions: [
    { code: "O", score: 82 },
    { code: "X", score: 74 },
  ],
};

describe("ShareModal", () => {
  it("opens as an accessible, inactive dialog without creating a share", async () => {
    mockShareCreate();
    render(<ShareModal isOpen onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: t("content.shareModalTitle", "en") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("common.close", "en") })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: t("content.shareCopyLink", "en") }),
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
      screen.getByRole("button", { name: t("content.shareCopyLink", "en") }),
    );

    // Az első másolás hozza létre a linket…
    expect(fetchMock).toHaveBeenCalledWith("/api/profile/share", { method: "POST" });
    // …és rögtön a vágólapra is kerül (userEvent clipboard-stub).
    await expect(navigator.clipboard.readText()).resolves.toMatch(/\/share\/tok123$/);
    expect(await screen.findByText(t("content.shareCopied", "en"))).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/\/share\/tok123$/)).not.toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: t("content.shareEmailCompact", "en") }));
    await user.type(
      screen.getByPlaceholderText(t("content.shareEmailPlaceholder", "en")),
      "friend@example.com",
    );
    await user.click(screen.getByRole("button", { name: t("content.shareEmailSend", "en") }));

    expect(await screen.findByText(/Sent to:/)).toHaveTextContent("friend@example.com");
    expect(screen.getByText(t("content.shareEmailQrHint", "en"))).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/\/share\/mailtok$/)).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: t("content.shareEmailCompact", "en") }));
    await user.type(
      screen.getByPlaceholderText(t("content.shareEmailPlaceholder", "en")),
      "not-an-email",
    );
    await user.click(screen.getByRole("button", { name: t("content.shareEmailSend", "en") }));

    expect(await screen.findByText(t("content.shareEmailInvalid", "en"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires confirmation before revoking an existing share, then keeps link creation available", async () => {
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

    expect(screen.queryByDisplayValue(/\/share\/oldtok$/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t("content.shareManage", "en") }));
    await user.click(screen.getByRole("button", { name: t("content.shareRevoke", "en") }));
    expect(screen.getByText(t("content.shareRevokeConfirmTitle", "en"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: t("content.shareRevokeConfirm", "en") }),
    );

    expect(await screen.findByText(t("content.shareRevoked", "en"))).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/profile/share", { method: "DELETE" });

    // A kompakt Link gomb új tokent készít és másol visszavonás után.
    await user.click(screen.getByRole("button", { name: t("content.shareCopyLink", "en") }));
    await expect(navigator.clipboard.readText()).resolves.toMatch(/\/share\/tok123$/);
  });

  it("copies the generated image and opens a blank LinkedIn composer on desktop", async () => {
    const user = userEvent.setup();
    const popup = {
      opener: window,
      location: { href: "" },
      close: vi.fn(),
    };
    const openSpy = vi
      .spyOn(window, "open")
      .mockReturnValue(popup as unknown as Window);
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator.clipboard, "write", {
      configurable: true,
      value: clipboardWrite,
    });
    vi.stubGlobal("ClipboardItem", class ClipboardItemMock {
      constructor(public items: Record<string, Blob>) {}
    });
    render(<ShareModal isOpen preview={preview} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: t("content.shareLinkedInLabel", "en") }),
    );

    expect(openSpy).toHaveBeenCalledWith(
      "about:blank",
      "trita-linkedin-share",
      "width=720,height=760",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(clipboardWrite).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(popup.location.href).toBe("https://www.linkedin.com/feed/?shareActive=true");
    });
    expect(screen.getByText(t("content.shareLinkedInCopied", "en"))).toBeInTheDocument();
  });

  it("passes the generated image to native sharing when file sharing is available", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    const openSpy = vi.spyOn(window, "open");
    render(<ShareModal isOpen preview={preview} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: t("content.shareLinkedInLabel", "en") }),
    );

    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(share.mock.calls[0][0].files[0]).toBeInstanceOf(File);
    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.getByText(t("content.shareLinkedInShared", "en"))).toBeInTheDocument();
  });

  it("keeps the generated link visible when email delivery fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "SEND_FAILED", token: "kepttok" }),
    });
    render(<ShareModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: t("content.shareEmailCompact", "en") }));
    await user.type(
      screen.getByPlaceholderText(t("content.shareEmailPlaceholder", "en")),
      "friend@example.com",
    );
    await user.click(screen.getByRole("button", { name: t("content.shareEmailSend", "en") }));

    expect(await screen.findByText(t("content.shareEmailError", "en"))).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/\/share\/kepttok$/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("content.shareManage", "en") })).toBeInTheDocument();
  });
});
