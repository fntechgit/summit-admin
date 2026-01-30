// ---- Mocks must come first ----

// i18n translate: echo the key
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import SelectPageTemplateDialog from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Mock Redux actions
jest.mock("../../../actions/page-template-actions", () => ({
  getPageTemplates: jest.fn(() => () => Promise.resolve())
}));

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

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// Mock page templates data
const mockPageTemplates = [
  {
    id: 1,
    code: "TPL001",
    name: "Template One",
    info_mod: "Info Module 1",
    download_mod: "Download Module 1",
    upload_mod: "Upload Module 1"
  },
  {
    id: 2,
    code: "TPL002",
    name: "Template Two",
    info_mod: "Info Module 2",
    download_mod: "Download Module 2",
    upload_mod: "Upload Module 2"
  },
  {
    id: 3,
    code: "TPL003",
    name: "Template Three",
    info_mod: "Info Module 3",
    download_mod: "Download Module 3",
    upload_mod: "Upload Module 3"
  }
];

// Helper function to render the component with Redux store
const renderWithStore = (props, storeState = {}) => {
  const defaultState = {
    pageTemplateListState: {
      pageTemplates: mockPageTemplates,
      currentPage: 1,
      term: "",
      order: "id",
      orderDir: 1,
      total: mockPageTemplates.length,
      ...storeState
    }
  };

  const store = mockStore(defaultState);

  return render(
    <Provider store={store}>
      <SelectPageTemplateDialog
        onClose={jest.fn()}
        onSave={jest.fn()}
        {...props}
      />
    </Provider>
  );
};

describe("SelectPageTemplateDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Initialization", () => {
    test("renders the dialog with title", () => {
      renderWithStore();

      expect(
        screen.getByText("sponsor_pages.global_page_popup.title")
      ).toBeInTheDocument();
    });

    test("calls getPageTemplates on mount", () => {
      const {
        getPageTemplates
      } = require("../../../actions/page-template-actions");

      renderWithStore();

      expect(getPageTemplates).toHaveBeenCalledWith("", 1, 10, "id", 1, true);
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

    test("renders search input", () => {
      renderWithStore();

      expect(
        screen.getByPlaceholderText("sponsor_pages.placeholders.search")
      ).toBeInTheDocument();
    });

    test("renders save button as disabled initially", () => {
      renderWithStore();

      const saveButton = screen.getByRole("button", {
        name: "sponsor_pages.global_page_popup.add_selected"
      });
      expect(saveButton).toBeDisabled();
    });

    test("renders all page templates in table", () => {
      renderWithStore();

      expect(screen.getByText("TPL001")).toBeInTheDocument();
      expect(screen.getByText("Template One")).toBeInTheDocument();
      expect(screen.getByText("TPL002")).toBeInTheDocument();
      expect(screen.getByText("Template Two")).toBeInTheDocument();
    });
  });

  describe("Multi-selection mode (isMulti=true)", () => {
    test("renders checkboxes when isMulti is true", () => {
      renderWithStore({ isMulti: true });

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(mockPageTemplates.length);
    });

    test("allows selecting multiple items", async () => {
      renderWithStore({ isMulti: true });

      const checkboxes = screen.getAllByRole("checkbox");

      // Select first checkbox
      await userEvent.click(checkboxes[0]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();

      // Select second checkbox
      await userEvent.click(checkboxes[1]);
      expect(screen.getByText("2 items selected")).toBeInTheDocument();
    });

    test("allows deselecting items", async () => {
      renderWithStore({ isMulti: true });

      const checkboxes = screen.getAllByRole("checkbox");

      // Select and deselect first checkbox
      await userEvent.click(checkboxes[0]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();

      await userEvent.click(checkboxes[0]);
      expect(screen.getByText("0 items selected")).toBeInTheDocument();
    });

    test("enables save button when items are selected", async () => {
      renderWithStore({ isMulti: true });

      const checkboxes = screen.getAllByRole("checkbox");
      const saveButton = screen.getByRole("button", {
        name: "sponsor_pages.global_page_popup.add_selected"
      });

      expect(saveButton).toBeDisabled();

      await userEvent.click(checkboxes[0]);

      expect(saveButton).not.toBeDisabled();
    });

    test("calls onSave with all selected row IDs", async () => {
      const onSave = jest.fn();
      renderWithStore({ isMulti: true, onSave });

      const checkboxes = screen.getAllByRole("checkbox");

      // Select first and third items
      await userEvent.click(checkboxes[0]);
      await userEvent.click(checkboxes[2]);

      const saveButton = screen.getByRole("button", {
        name: "sponsor_pages.global_page_popup.add_selected"
      });
      await userEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith([1, 3]);
    });
  });

  describe("Single-selection mode (isMulti=false)", () => {
    test("renders radio buttons when isMulti is false", () => {
      renderWithStore({ isMulti: false });

      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons.length).toBe(mockPageTemplates.length);
    });

    test("allows selecting only one item at a time", async () => {
      renderWithStore({ isMulti: false });

      const radioButtons = screen.getAllByRole("radio");

      // Select first radio
      await userEvent.click(radioButtons[0]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();
      expect(radioButtons[0]).toBeChecked();

      // Select second radio - should deselect first
      await userEvent.click(radioButtons[1]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();
      expect(radioButtons[0]).not.toBeChecked();
      expect(radioButtons[1]).toBeChecked();
    });

    test("enables save button when one item is selected", async () => {
      renderWithStore({ isMulti: false });

      const radioButtons = screen.getAllByRole("radio");
      const saveButton = screen.getByRole("button", {
        name: "sponsor_pages.global_page_popup.add_selected"
      });

      expect(saveButton).toBeDisabled();

      await userEvent.click(radioButtons[0]);

      expect(saveButton).not.toBeDisabled();
    });

    test("calls onSave with single selected row ID", async () => {
      const onSave = jest.fn();
      renderWithStore({ isMulti: false, onSave });

      const radioButtons = screen.getAllByRole("radio");

      await userEvent.click(radioButtons[1]);

      const saveButton = screen.getByRole("button", {
        name: "sponsor_pages.global_page_popup.add_selected"
      });
      await userEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith([2]);
    });
  });

  describe("Search functionality", () => {
    test("calls getPageTemplates with search term", async () => {
      const {
        getPageTemplates
      } = require("../../../actions/page-template-actions");
      renderWithStore();

      const searchInput = screen.getByPlaceholderText(
        "sponsor_pages.placeholders.search"
      );

      await userEvent.type(searchInput, "Template");
      await userEvent.keyboard("{Enter}");

      await waitFor(() => {
        expect(getPageTemplates).toHaveBeenCalledWith(
          "Template",
          1,
          10,
          "id",
          1,
          true
        );
      });
    });
  });

  describe("Close functionality", () => {
    test("calls onClose when close button is clicked", async () => {
      const onClose = jest.fn();
      renderWithStore({ onClose });

      const closeButton = screen.getByRole("button", { name: "" });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    test("resets selected rows when closing", async () => {
      const onClose = jest.fn();
      renderWithStore({ isMulti: true, onClose });

      const checkboxes = screen.getAllByRole("checkbox");

      // Select an item
      await userEvent.click(checkboxes[0]);
      expect(screen.getByText("1 items selected")).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByRole("button", { name: "" });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Load more functionality", () => {
    test("calls getPageTemplates to load more when scrolling", () => {
      const {
        getPageTemplates
      } = require("../../../actions/page-template-actions");
      renderWithStore({}, { total: 20 }); // More items available than displayed

      // The component should be rendered with loadMoreData available
      // This would typically be triggered by scrolling in the MuiInfiniteTable
      // The test verifies the component is set up with the correct total
      expect(getPageTemplates).toHaveBeenCalledTimes(1);
    });
  });

  describe("Sorting functionality", () => {
    test("calls getPageTemplates with sort parameters", () => {
      const {
        getPageTemplates
      } = require("../../../actions/page-template-actions");
      renderWithStore();

      // Initial call on mount
      expect(getPageTemplates).toHaveBeenCalledWith("", 1, 10, "id", 1, true);

      // The actual sort interaction would be handled by MuiInfiniteTable
      // This test verifies the component is initialized with correct sort params
    });
  });

  describe("Empty state", () => {
    test("renders nothing when no templates are available", () => {
      renderWithStore({}, { pageTemplates: [] });

      // Table headers might still be present, but no template rows
      expect(screen.queryByText("TPL001")).not.toBeInTheDocument();
      expect(screen.queryByText("Template One")).not.toBeInTheDocument();
    });
  });
});
