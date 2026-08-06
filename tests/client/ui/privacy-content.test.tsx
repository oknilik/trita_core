/**
 * Adatvédelmi tájékoztató — megjelenítési szerződés (Vitest + RTL).
 *
 * A lap tartalma tipizált dokumentumból jön (`src/lib/legal/privacy-policy.ts`),
 * a komponens csak a blokk-típusokat rendereli. Amit itt rögzítünk:
 *  - minden szakasz megjelenik, saját `id`-vel (a tartalomjegyzék mélylinkjei
 *    és a jogi hivatkozhatóság ezen múlik),
 *  - a szakaszcímek `h2`-k, a lap címe `h1` (helyes címsor-hierarchia),
 *  - a táblázatok valódi `table`/`th`/`td` szerkezetben állnak (nem div-rács),
 *  - a tartalomjegyzék minden szakaszra mutat,
 *  - a cégadat-tervezet jelölése látszik, amíg a helykitöltők élnek.
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// A lap a LocaleProvider kontextusából olvassa a nyelvet; a valódi provider
// app-routert igényel, ezért a bevett projekt-minta szerint kimockoljuk.
vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

import { PrivacyContent } from "@/app/(marketing)/privacy/PrivacyContent";
import { LEGAL_DOCS_ARE_DRAFT } from "@/lib/legal/company";
import { getPrivacyPolicy } from "@/lib/legal/privacy-policy";

const doc = getPrivacyPolicy("hu");

function renderPrivacy() {
  return render(<PrivacyContent />);
}

describe("PrivacyContent", () => {
  it("a dokumentum minden szakaszát rendereli, horgonyozható id-vel", () => {
    const { container } = renderPrivacy();

    for (const section of doc.sections) {
      const node = container.querySelector(`section#${section.id}`);
      expect(node, `hiányzó szakasz: ${section.id}`).not.toBeNull();
      expect(within(node as HTMLElement).getByRole("heading", { level: 2 }).textContent).toBe(
        section.title,
      );
    }
  });

  it("egyetlen h1-et használ, és az a dokumentum címe", () => {
    renderPrivacy();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe(doc.title);
  });

  it("a táblázatokat valódi táblázat-szerkezetben rendereli", () => {
    const { container } = renderPrivacy();
    const expectedTables = doc.sections
      .flatMap((section) => section.blocks)
      .filter((block) => block.kind === "table");

    const tables = container.querySelectorAll("table");
    expect(tables).toHaveLength(expectedTables.length);

    const first = tables[0];
    expect(first.querySelectorAll("th").length).toBeGreaterThan(0);
    expect(first.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
  });

  it("a tartalomjegyzék minden szakaszra mutat", () => {
    const { container } = renderPrivacy();
    const tocLinks = Array.from(container.querySelectorAll('nav a[href^="#"]')).map((a) =>
      a.getAttribute("href"),
    );

    for (const section of doc.sections) {
      expect(tocLinks).toContain(`#${section.id}`);
    }
  });

  it("jelzi, hogy a cégadatok még helykitöltők", () => {
    renderPrivacy();
    if (LEGAL_DOCS_ARE_DRAFT) {
      expect(screen.getAllByText(doc.draftBadge).length).toBeGreaterThan(0);
      expect(screen.getByText(doc.draftNote)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(doc.draftNote)).not.toBeInTheDocument();
    }
  });
});
