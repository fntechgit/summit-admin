// src/components/sponsors/reports/__tests__/FilterBar.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import FilterBar from "../FilterBar";

// Hoist mock above component import so T.translate returns the key.
jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

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

  it("renders the Report Filters card title", () => {
    renderWithRedux(<FilterBar sponsors={[]} value={{}} onApply={() => {}} />);
    expect(
      screen.getByText("sponsor_reports_page.report_filters")
    ).toBeInTheDocument();
  });

  it("renders the search box only when showSearch is set, and emits the search string", () => {
    const onApply = jest.fn();
    const { rerender } = renderWithRedux(
      <FilterBar
        sponsors={sponsors}
        onApply={onApply}
        value={{ search: "acme" }}
      />
    );
    // default: no search box
    expect(screen.queryByLabelText(/search/i)).not.toBeInTheDocument();

    rerender(
      <FilterBar
        sponsors={sponsors}
        onApply={onApply}
        value={{ search: "acme" }}
        showSearch
      />
    );
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ search: "acme" })
    );
  });
});
