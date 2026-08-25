import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FetchAuthStateProvider,
  useAuthState,
} from "@/components/auth/auth-state";

function AuthStateProbe() {
  const { isSignedIn, markSignedOut } = useAuthState();

  return (
    <button type="button" onClick={markSignedOut}>
      {isSignedIn ? "signed-in" : "signed-out"}
    </button>
  );
}

describe("marketing auth state", () => {
  afterEach(() => {
    document.cookie = "__client_uat=; Max-Age=0; path=/";
  });

  it("kijelentkezéskor teljes oldalfrissítés nélkül no-auth állapotra vált", async () => {
    document.cookie = "__client_uat=123; path=/";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ username: "Teszt Elek", email: "teszt@example.com" }),
      }),
    );

    render(
      <FetchAuthStateProvider>
        <AuthStateProbe />
      </FetchAuthStateProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("signed-in"));
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("signed-out");
  });
});
