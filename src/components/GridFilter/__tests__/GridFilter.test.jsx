/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { GridFilter, OPERATORS } from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// MUI Fade never fires its exit callback in jsdom (no CSS transition events),
// so dialogs stay in the DOM after close. This makes it synchronous.
jest.mock(
  "@mui/material/Fade",
  () =>
    ({ children, in: inProp }) =>
      inProp ? children : null
);

const mockStore = configureStore([thunk]);

const makeStore = (filters = []) =>
  mockStore({ allGridFiltersState: { allFilters: filters } });

const criterias = [
  {
    key: "track",
    label: "Track",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: [
          { value: 1, label: "OpenStack" },
          { value: 2, label: "FnTech" }
        ],
        placeholder: "Select Track"
      }
    }
  },
  {
    key: "sponsor",
    label: "Sponsor",
    operators: [OPERATORS.IS, OPERATORS.LIKE],
    values: {
      type: "text",
      props: { placeholder: "Type Sponsor Name" }
    }
  }
];

const renderGridFilter = (props = {}) =>
  render(
    <Provider store={makeStore()}>
      <GridFilter
        id="test-filter"
        criterias={criterias}
        onApply={jest.fn()}
        {...props}
      />
    </Provider>
  );

describe("GridFilter", () => {
  test("renders the filter button", () => {
    renderGridFilter();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("opens the dialog when the filter button is clicked", () => {
    renderGridFilter();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("dialog contains apply and cancel buttons", () => {
    renderGridFilter();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("grid_filter.apply_filters")).toBeInTheDocument();
    expect(screen.getByText("grid_filter.cancel")).toBeInTheDocument();
  });

  test("closes the dialog when cancel is clicked", () => {
    renderGridFilter();
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("grid_filter.cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
