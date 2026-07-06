// src/components/sponsors/reports/__tests__/FilterBar.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import FilterBar from "../FilterBar";

// Hoist mock above component import so T.translate returns the key.
jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

// Mock the uicore SearchInput to a plain input that calls onSearch synchronously,
// so we test FilterBar's live-search WIRING without the real 500ms debounce.
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ term, onSearch, placeholder }) => {
      const React = require("react"); // eslint-disable-line global-require
      return React.createElement("input", {
        placeholder,
        defaultValue: term,
        onChange: (e) => onSearch(e.target.value)
      });
    }
  })
);

const sponsors = [
  { id: 17, name: "Acme" },
  { id: 23, name: "Globex" }
];

describe("FilterBar", () => {
  it("emits a sponsorIds array (multi-select) on Apply", () => {
    const onApply = jest.fn();
    renderWithRedux(
      <FilterBar
        sponsors={sponsors}
        onApply={onApply}
        value={{ sponsorIds: [17, 23] }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ sponsorIds: [17, 23] })
    );
  });

  it("applies search live (does not wait for the Apply button)", () => {
    const onApply = jest.fn();
    // `value` deliberately OMITTED: exercises the module-level EMPTY_VALUE
    // default. An inline `{}` default would be a fresh identity each render
    // and loop the value-resync effect ("Maximum update depth exceeded") —
    // this test guards that regression.
    renderWithRedux(
      <FilterBar sponsors={sponsors} onApply={onApply} showSearch />
    );
    fireEvent.change(
      screen.getByPlaceholderText("sponsor_reports_page.search"),
      {
        target: { value: "acme" }
      }
    );
    // onSearch commits + applies immediately — no Apply click.
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ search: "acme" })
    );
  });
});
