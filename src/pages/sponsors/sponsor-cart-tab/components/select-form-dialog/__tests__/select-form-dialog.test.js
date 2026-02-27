// ---- Mocks must come first ----

// i18n translate: echo the key
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Mock Redux actions
jest.mock("../../../../../../actions/sponsor-cart-actions", () => ({
  getSponsorFormsForCart: jest.fn(() => () => Promise.resolve())
}));

// Mock SearchInput component
jest.mock("../../../../../../components/mui/search-input", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onSearch, term }) => {
      const handleKeyDown = (e) => {
        if (e.key === "Enter") {
          onSearch(e.target.value);
        }
      };
      return (
        <input
          data-testid="search-input"
          placeholder="sponsor_pages.placeholders.search"
          defaultValue={term}
          onKeyDown={handleKeyDown}
        />
      );
    }
  };
});

// Mock MuiInfiniteTable component
jest.mock("../../../../../../components/mui/infinite-table", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ columns, data, onSort, loadMoreData }) => (
      <div data-testid="infinite-table">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.columnKey}>
                  {col.sortable ? (
                    <button onClick={() => onSort(col.columnKey, 1)}>
                      {col.header}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={`${row.id}-${col.columnKey}`}>
                    {col.render ? col.render(row) : row[col.columnKey]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {loadMoreData && (
          <button onClick={loadMoreData} data-testid="load-more">
            Load More
          </button>
        )}
      </div>
    )
  };
});

// Mock SponsorAddonSelect component
jest.mock("../../../../../../components/mui/sponsor-addon-select", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onChange, value, placeholder }) => (
      <select
        data-testid="addon-select"
        value={value || ""}
        onChange={(e) => {
          const addonId = parseInt(e.target.value, 10);
          onChange(addonId ? { id: addonId, name: `Addon ${addonId}` } : null);
        }}
      >
        <option value="">{placeholder}</option>
        <option value="1">Addon 1</option>
        <option value="2">Addon 2</option>
      </select>
    )
  };
});

// Avoid MUI ripple noise
jest.mock("@mui/material/IconButton", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, onClick, ...rest }) => (
      <button type="button" onClick={onClick} {...rest}>
        {children}
      </button>
    )
  };
});
jest.mock("@mui/material/ButtonBase/TouchRipple", () => ({
  __esModule: true,
  default: () => null
}));

// ---- Now imports ----
/* eslint-disable import/first */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import SelectFormDialog from "../index";
/* eslint-enable import/first */

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// Mock form data
const mockForms = [
  {
    id: 1,
    code: "FORM001",
    name: "Installation Form",
    item_count: 5
  },
  {
    id: 2,
    code: "FORM002",
    name: "Dismantle Form",
    item_count: 3
  },
  {
    id: 3,
    code: "FORM003",
    name: "Setup Form",
    item_count: 8
  }
];

// Helper function to render the component with Redux store
const renderWithStore = (props, storeState = {}) => {
  const defaultState = {
    sponsorPageCartListState: {
      availableForms: {
        forms: mockForms,
        currentPage: 1,
        term: "",
        order: "id",
        orderDir: 1,
        total: mockForms.length,
        ...storeState
      }
    }
  };

  const store = mockStore(defaultState);

  const defaultProps = {
    open: true,
    summitId: 1,
    sponsor: { id: 10, name: "Test Sponsor" },
    onClose: jest.fn(),
    onSave: jest.fn(),
    ...props
  };

  return render(
    <Provider store={store}>
      <SelectFormDialog {...defaultProps} />
    </Provider>
  );
};

// ---- Tests ----
describe("SelectFormDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Initialization", () => {
    test("renders the dialog with title", () => {
      renderWithStore();

      expect(
        screen.getByText("edit_sponsor.cart_tab.add_form_to_cart")
      ).toBeInTheDocument();
    });

    test("calls getSponsorFormsForCart when dialog opens", () => {
      const {
        getSponsorFormsForCart
      } = require("../../../../../../actions/sponsor-cart-actions");

      renderWithStore();

      expect(getSponsorFormsForCart).toHaveBeenCalled();
    });

    test("does not call getSponsorFormsForCart when dialog is closed", () => {
      const {
        getSponsorFormsForCart
      } = require("../../../../../../actions/sponsor-cart-actions");

      renderWithStore({ open: false });

      expect(getSponsorFormsForCart).not.toHaveBeenCalled();
    });

    test("displays initial selection count as 0", () => {
      renderWithStore();

      expect(screen.getByText("0 items selected")).toBeInTheDocument();
    });

    test("renders close button", () => {
      renderWithStore();

      const closeButton = screen.getByRole("button", { name: "" });
      expect(closeButton).toBeInTheDocument();
    });

    test("renders addon select dropdown", () => {
      renderWithStore();

      expect(screen.getByTestId("addon-select")).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.select_addon")
      ).toBeInTheDocument();
    });

    test("renders search input", () => {
      renderWithStore();

      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });

    test("renders save button as disabled initially", () => {
      renderWithStore();

      const saveButton = screen.getByRole("button", {
        name: "edit_sponsor.cart_tab.add_selected_form"
      });
      expect(saveButton).toBeDisabled();
    });

    test("renders all forms in table", () => {
      renderWithStore();

      expect(screen.getByText("FORM001")).toBeInTheDocument();
      expect(screen.getByText("Installation Form")).toBeInTheDocument();
      expect(screen.getByText("FORM002")).toBeInTheDocument();
      expect(screen.getByText("Dismantle Form")).toBeInTheDocument();
    });
  });

  describe("Form Selection", () => {
    test("allows selecting a single form with radio button", async () => {
      renderWithStore();

      const radioButtons = screen.getAllByRole("radio");

      // Select first radio
      await userEvent.click(radioButtons[0]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();
      expect(radioButtons[0]).toBeChecked();
    });

    test("selecting another form deselects the previous one", async () => {
      renderWithStore();

      const radioButtons = screen.getAllByRole("radio");

      // Select first radio
      await userEvent.click(radioButtons[0]);
      expect(radioButtons[0]).toBeChecked();

      // Select second radio - should deselect first
      await userEvent.click(radioButtons[1]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();
      expect(radioButtons[0]).not.toBeChecked();
      expect(radioButtons[1]).toBeChecked();
    });

    test("enables save button when a form is selected", async () => {
      renderWithStore();

      const radioButtons = screen.getAllByRole("radio");
      const saveButton = screen.getByRole("button", {
        name: "edit_sponsor.cart_tab.add_selected_form"
      });

      expect(saveButton).toBeDisabled();

      await userEvent.click(radioButtons[0]);

      expect(saveButton).not.toBeDisabled();
    });
  });

  describe("Addon Selection", () => {
    test("allows selecting an addon", async () => {
      renderWithStore();

      const addonSelect = screen.getByTestId("addon-select");

      await userEvent.selectOptions(addonSelect, "1");

      expect(addonSelect).toHaveValue("1");
    });

    test("can clear addon selection", async () => {
      renderWithStore();

      const addonSelect = screen.getByTestId("addon-select");

      await userEvent.selectOptions(addonSelect, "1");
      expect(addonSelect).toHaveValue("1");

      await userEvent.selectOptions(addonSelect, "");
      expect(addonSelect).toHaveValue("");
    });
  });

  describe("Save Functionality", () => {
    test("calls onSave with selected form and no addon", async () => {
      const onSave = jest.fn();
      renderWithStore({ onSave });

      const radioButtons = screen.getAllByRole("radio");

      // Select first form
      await userEvent.click(radioButtons[0]);

      const saveButton = screen.getByRole("button", {
        name: "edit_sponsor.cart_tab.add_selected_form"
      });
      await userEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(mockForms[0], null);
    });

    test("calls onSave with selected form and addon", async () => {
      const onSave = jest.fn();
      renderWithStore({ onSave });

      const radioButtons = screen.getAllByRole("radio");
      const addonSelect = screen.getByTestId("addon-select");

      // Select addon
      await userEvent.selectOptions(addonSelect, "1");

      // Select form
      await userEvent.click(radioButtons[1]);

      const saveButton = screen.getByRole("button", {
        name: "edit_sponsor.cart_tab.add_selected_form"
      });
      await userEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(mockForms[1], {
        id: 1,
        name: "Addon 1"
      });
    });

    test("resets selection after save", async () => {
      const onSave = jest.fn();
      renderWithStore({ onSave });

      const radioButtons = screen.getAllByRole("radio");

      // Select form
      await userEvent.click(radioButtons[0]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();

      const saveButton = screen.getByRole("button", {
        name: "edit_sponsor.cart_tab.add_selected_form"
      });
      await userEvent.click(saveButton);

      // Selection should be reset
      expect(radioButtons[0]).not.toBeChecked();
    });
  });

  describe("Close Functionality", () => {
    test("calls onClose when close button is clicked", async () => {
      const onClose = jest.fn();
      renderWithStore({ onClose });

      const closeButton = screen.getByRole("button", { name: "" });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    test("resets selected rows and addon when closing", async () => {
      const onClose = jest.fn();
      renderWithStore({ onClose });

      const radioButtons = screen.getAllByRole("radio");
      const addonSelect = screen.getByTestId("addon-select");

      // Select form and addon
      await userEvent.selectOptions(addonSelect, "1");
      await userEvent.click(radioButtons[0]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByRole("button", { name: "" });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Search Functionality", () => {
    test("calls getSponsorFormsForCart with search term", async () => {
      const {
        getSponsorFormsForCart
      } = require("../../../../../../actions/sponsor-cart-actions");
      renderWithStore();

      const searchInput = screen.getByTestId("search-input");

      await userEvent.type(searchInput, "Installation{Enter}");

      await waitFor(() => {
        expect(getSponsorFormsForCart).toHaveBeenCalledWith("Installation");
      });
    });
  });

  describe("Sorting Functionality", () => {
    test("calls getSponsorFormsForCart with sort parameters", async () => {
      const {
        getSponsorFormsForCart
      } = require("../../../../../../actions/sponsor-cart-actions");
      renderWithStore();

      // Find sortable column button (code column)
      const codeHeader = screen.getByRole("button", {
        name: "edit_sponsor.cart_tab.code"
      });
      await userEvent.click(codeHeader);

      expect(getSponsorFormsForCart).toHaveBeenCalledWith("", 1, "code", 1);
    });
  });

  describe("Load More Functionality", () => {
    test("calls getSponsorFormsForCart to load next page", async () => {
      const {
        getSponsorFormsForCart
      } = require("../../../../../../actions/sponsor-cart-actions");
      renderWithStore({}, { total: 20 }); // More items available

      const loadMoreButton = screen.getByTestId("load-more");
      await userEvent.click(loadMoreButton);

      expect(getSponsorFormsForCart).toHaveBeenCalledWith("", 2, "id", 1);
    });

    test("does not load more when all items are displayed", () => {
      const {
        getSponsorFormsForCart
      } = require("../../../../../../actions/sponsor-cart-actions");
      renderWithStore({}, { total: mockForms.length });

      // Initial call only
      expect(getSponsorFormsForCart).toHaveBeenCalledTimes(1);
    });
  });

  describe("Empty State", () => {
    test("displays no forms message when forms array is empty", () => {
      renderWithStore({}, { forms: [] });

      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.no_forms_found")
      ).toBeInTheDocument();
    });

    test("does not render table when no forms available", () => {
      renderWithStore({}, { forms: [] });

      expect(screen.queryByTestId("infinite-table")).not.toBeInTheDocument();
    });
  });

  describe("Column Display", () => {
    test("renders all table columns with correct headers", () => {
      renderWithStore();

      expect(
        screen.getByText("edit_sponsor.cart_tab.code")
      ).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.name")
      ).toBeInTheDocument();
      expect(screen.getByText("general.items")).toBeInTheDocument();
    });

    test("displays form data correctly in table rows", () => {
      renderWithStore();

      // Check first form
      expect(screen.getByText("FORM001")).toBeInTheDocument();
      expect(screen.getByText("Installation Form")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();

      // Check second form
      expect(screen.getByText("FORM002")).toBeInTheDocument();
      expect(screen.getByText("Dismantle Form")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });
});
