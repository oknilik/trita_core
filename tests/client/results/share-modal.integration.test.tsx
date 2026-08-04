/**
 * ShareModal client integration tests (Vitest + RTL)
 *
 * Covers: deferred link creation (UX-B6 — opening the modal must not write
 * a share token; the first copy materializes it), clipboard copy with inline
 * feedback (no browser alert), optional email sending with validation states
 * (token is created server-side), and share revocation + new link creation.
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
  it("does not create a share link on open (UX-B6)", async () => {
    mockShareCreate();
    render(<ShareModal isOpen onClose={vi.fn()} />);

    // A modal megnyitása önmagában nem írhat shareTokent — semmilyen
    // hálózati hívás nem történhet.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: t("content.shareCopyLink", "en") }),
      ).toBeEnabled();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates the link on first copy and copies it with inline feedback, no alert", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockShareCreate();
    render(<ShareModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: t("content.shareCopyLink", "en") }));

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

  it("sends the link by email without a client-side link (token is created server-side)", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/profile/share/send") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    render(<ShareModal isOpen onClose={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(t("content.shareEmailPlaceholder", "en")),
      "friend@example.com",
    );
    await user.click(screen.getByRole("button", { name: t("content.shareEmailSend", "en") }));

    expect(await screen.findByText(t("content.shareEmailSent", "en"))).toBeInTheDocument();
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

    await user.type(
      screen.getByPlaceholderText(t("content.shareEmailPlaceholder", "en")),
      "not-an-email",
    );
    await user.click(screen.getByRole("button", { name: t("content.shareEmailSend", "en") }));

    expect(await screen.findByText(t("content.shareEmailInvalid", "en"))).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("revokes existing shares without a materialized link, then offers a new one", async () => {
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
    render(<ShareModal isOpen onClose={vi.fn()} />);

    // Korábbi munkamenetben létrehozott link is visszavonható — nem kell
    // előbb megjeleníteni (a DELETE szerver-oldalon minden tokent töröl).
    await user.click(screen.getByRole("button", { name: t("content.shareRevoke", "en") }));

    expect(await screen.findByText(t("content.shareRevoked", "en"))).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/profile/share", { method: "DELETE" });

    // Új link létrehozása visszavonás után
    await user.click(screen.getByRole("button", { name: t("content.shareCreateNew", "en") }));
    expect(await screen.findByDisplayValue(/\/share\/tok123$/)).toBeInTheDocument();
  });
});
