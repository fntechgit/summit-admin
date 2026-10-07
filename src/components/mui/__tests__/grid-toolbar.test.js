import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import GridToolbar from "../grid-toolbar";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () =>
    function MockSearchInput({ placeholder }) {
      return <input placeholder={placeholder} />;
    }
);

describe("GridToolbar", () => {
  test("renders the archive toggle when archiveToggleProps is set, and forwards its changes", async () => {
    const onChange = jest.fn();
    render(
      <GridToolbar archiveToggleProps={{ showArchived: false, onChange }} />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "general.archived" })
    );
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test("renders a page's own filter in the filter slot", () => {
    render(<GridToolbar filter={<span>Hide past events</span>} />);
    expect(screen.getByText("Hide past events")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "general.archived" })
    ).not.toBeInTheDocument();
  });

  test("shows the archive toggle instead of the filter when both are given", () => {
    render(
      <GridToolbar
        archiveToggleProps={{ showArchived: false, onChange: jest.fn() }}
        filter={<span>Hide past events</span>}
      />
    );
    expect(
      screen.getByRole("button", { name: "general.archived" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Hide past events")).not.toBeInTheDocument();
  });

  test("renders neither when no filter props are given", () => {
    render(
      <GridToolbar searchProps={{ onSearch: jest.fn(), placeholder: "Search" }}>
        <button type="button">Add</button>
      </GridToolbar>
    );
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "general.archived" })
    ).not.toBeInTheDocument();
  });
});
