import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  CompareInviteCard,
  type SerializedCompareInvite,
} from "@/components/results/CompareInviteCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu" }),
}));

const acceptedInvite: SerializedCompareInvite = {
  id: "inv-accepted",
  token: null,
  state: "ACCEPTED",
  role: "inviter",
  otherName: "Anna",
  createdAt: "2026-08-01T10:00:00.000Z",
  acceptedAt: "2026-08-02T10:00:00.000Z",
  expiresAt: "2026-09-01T10:00:00.000Z",
  otherGlyph: null,
};

const pendingInvite: SerializedCompareInvite = {
  id: "inv-pending",
  token: "tok-1",
  state: "PENDING",
  role: "inviter",
  otherName: null,
  createdAt: "2026-08-10T10:00:00.000Z",
  acceptedAt: null,
  expiresAt: "2026-09-09T10:00:00.000Z",
  otherGlyph: null,
};

describe("CompareInviteCard", () => {
  it("nulla kapcsolatnál a meghívás a feladat: nyitott űrlap, nem rejtett másodlagos művelet", () => {
    render(<CompareInviteCard invites={[]} />);

    expect(
      screen.getByRole("heading", { name: "Hívj meg valakit a közös képhez" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Válassz a kapcsolataid közül" }),
    ).not.toBeInTheDocument();

    // Az egyetlen értelmes következő lépés azonnal használható.
    expect(
      screen.getByPlaceholderText("email@pelda.hu (nem kötelező)"),
    ).toBeInTheDocument();
    // Nincs mire visszacsukni, tehát nincs toggle sem.
    expect(
      screen.queryByRole("button", { name: "Személy meghívása" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Meghívás elrejtése" }),
    ).not.toBeInTheDocument();
  });

  it("elfogadott kapcsolatnál a lista a tartalom, a meghívás másodlagos", async () => {
    const user = userEvent.setup();
    render(<CompareInviteCard invites={[acceptedInvite]} />);

    expect(
      screen.getByRole("heading", { name: "Válassz a kapcsolataid közül" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Anna" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Személy meghívása" }));

    expect(
      screen.getByPlaceholderText("email@pelda.hu (nem kötelező)"),
    ).toBeInTheDocument();
  });

  it("nem mond üres listát, ha a kiküldött link még elfogadásra vár", () => {
    render(<CompareInviteCard invites={[pendingInvite]} />);

    expect(
      screen.getByText(/A kiküldött linkre vár/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Még nincs aktív linked vagy elfogadott párod."),
    ).not.toBeInTheDocument();
    // A függő lista ott van — az ellentmondás így nem tud előjönni.
    expect(
      screen.getByRole("heading", { name: "Függő meghívások" }),
    ).toBeInTheDocument();
  });

  it("a visszavonást megerősítéshez köti, mert a másik félnél is megszűnik", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<CompareInviteCard invites={[acceptedInvite]} />);

    await user.click(screen.getByRole("button", { name: "Visszavonás" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      screen.getByText("Mindkettőtöknél megszűnik. Biztos?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Visszavonás" }),
    ).toBeInTheDocument();
    fetchSpy.mockRestore();
  });
});
