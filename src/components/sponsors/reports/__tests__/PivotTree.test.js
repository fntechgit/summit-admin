import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import PivotTree from "../PivotTree";
import { buildPivotTree } from "../build-pivot-tree";

// ContentCell/StatusRollupChips render via T.translate — mock i18n to keys (sibling pattern).
jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

const rows = [
  {
    sponsor: { id: 7, name: "Acme", tier: "GOLD" },
    page: { id: 99, title: "Booth Staff" },
    module: { component_name: "Logo", title: "Logo" },
    status: "completed",
    content: { value: "ok" }
  }
];

it("renders group labels and a sponsor drill-down link", () => {
  const nodes = buildPivotTree(rows, ["sponsor", "component"]);
  render(
    <MemoryRouter>
      <PivotTree nodes={nodes} summitId={42} depth={0} maxDepth={2} />
    </MemoryRouter>
  );
  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    "/app/summits/42/sponsors/reports/sponsor-assets/sponsors/7"
  );
});
