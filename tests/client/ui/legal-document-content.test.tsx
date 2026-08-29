import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

import { LegalDocumentContent } from "@/app/(marketing)/legal/[slug]/LegalDocumentContent";
import { getLegalDocument } from "@/lib/legal/documents";

const document = getLegalDocument("platform-terms");

describe("LegalDocumentContent", () => {
  it("a teljes jogi törzsszöveget HTML-ként rendereli", () => {
    if (!document) throw new Error("hiányzó platformfeltételek");

    const { container } = render(<LegalDocumentContent document={document} />);

    expect(screen.getByRole("heading", { level: 1, name: document.title.hu })).toBeInTheDocument();
    expect(container.querySelectorAll("article h2")).toHaveLength(
      document.content.filter((block) => block.kind === "heading" && block.level === 1).length,
    );
    expect(container.querySelectorAll("article table")).toHaveLength(
      document.content.filter((block) => block.kind === "table").length,
    );
    expect(screen.getByText(/A jelen Feltételek szerinti egyéni szolgáltatás díjmentes/)).toBeInTheDocument();
  });

  it("nem kínál repositoryban tárolt Word-letöltést", () => {
    if (!document) throw new Error("hiányzó platformfeltételek");

    const { container } = render(<LegalDocumentContent document={document} />);
    expect(container.querySelector('a[download]')).toBeNull();
    expect(container.querySelector('a[href$=".docx"]')).toBeNull();
  });
});
