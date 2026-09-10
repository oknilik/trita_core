import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PrimaryTabs } from "@/components/org/PrimaryTabs";

function Tabs() {
  const [active, setActive] = useState("teams");
  return <><PrimaryTabs idPrefix="org-tabs" label="Szervezet" tabs={[{ key: "teams", label: "Csapatok" }, { key: "members", label: "Tagok" }]} activeTab={active} onTabChange={setActive} /><div id="org-tabs-panel" role="tabpanel" aria-labelledby={`org-tabs-${active}`}>{active}</div></>;
}
it("org tabs expose their selected panel and support roving keyboard navigation", async () => {
  render(<Tabs />);
  const first = screen.getByRole("tab", { name: "Csapatok" });
  first.focus();
  expect(first).toHaveAttribute("aria-selected", "true");
  await userEvent.keyboard("{ArrowRight}");
  const second = screen.getByRole("tab", { name: "Tagok" });
  expect(second).toHaveFocus();
  expect(second).toHaveAttribute("aria-selected", "true");
  expect(first).toHaveAttribute("tabindex", "-1");
  expect(screen.getByRole("tabpanel", { name: "Tagok" })).toHaveTextContent("members");
  await userEvent.keyboard("{Home}");
  expect(first).toHaveFocus();
});
