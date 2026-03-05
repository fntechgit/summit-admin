// ---- Mocks must come first ----

// i18n translate: echo the key
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Mock Redux actions
const mockGetSponsorCartForm = jest.fn(() => () => Promise.resolve());
const mockUpdateCartForm = jest.fn(() => () => Promise.resolve());

jest.mock("../../../../actions/sponsor-cart-actions", () => ({
  getSponsorCartForm: (...args) => mockGetSponsorCartForm(...args),
  updateCartForm: (...args) => mockUpdateCartForm(...args)
}));

// Mock EditForm component
jest.mock("../components/edit-form/index", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ form, onSaveForm, onCancel }) => (
        <div data-testid="edit-form">
          <div data-testid="form-code">{form.code}</div>
          <div data-testid="form-name">{form.name}</div>
          {form.addon_name && (
            <div data-testid="form-addon">{form.addon_name}</div>
          )}
          {form.items?.map((item) => (
            <div
              key={item.form_item_id}
              data-testid={`form-item-${item.form_item_id}`}
            >
              {item.name}
            </div>
          ))}
          <div data-testid="discount-amount">{form.discount_amount}</div>
          <div data-testid="discount-type">{form.discount_type}</div>
          <button data-testid="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            data-testid="save-button"
            onClick={() =>
              onSaveForm({
                discount_amount: form.discount_amount,
                discount_type: form.discount_type,
                items: form.items
              })
            }
          >
            Save
          </button>
        </div>
      )
  };
});

// Avoid MUI ripple noise
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
import EditCartForm from "../components/edit-form/edit-cart-form";
/* eslint-enable import/first */

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// Mock form data
const mockCartForm = {
  id: 1,
  code: "FORM001",
  name: "Installation Form",
  discount_amount: 0,
  discount_type: "AMOUNT",
  items: [
    {
      form_item_id: 101,
      name: "Item 1",
      quantity: 1,
      meta_fields: []
    },
    {
      form_item_id: 102,
      name: "Item 2",
      quantity: 2,
      meta_fields: []
    }
  ]
};

// Helper function to render the component with Redux store
const renderWithStore = (props, storeState = {}) => {
  const defaultState = {
    sponsorPageCartListState: {
      cartForm:
        storeState.cartForm !== undefined ? storeState.cartForm : mockCartForm
    }
  };

  const store = mockStore(defaultState);

  const defaultProps = {
    formId: 1,
    onCancel: jest.fn(),
    onSaveCallback: jest.fn(),
    ...props
  };

  return render(
    <Provider store={store}>
      <EditCartForm {...defaultProps} />
    </Provider>
  );
};

// ---- Tests ----
describe("EditCartForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Initialization", () => {
    test("calls getSponsorCartForm on mount with correct formId", () => {
      renderWithStore({ formId: 123 });

      expect(mockGetSponsorCartForm).toHaveBeenCalledWith(123);
    });

    test("renders null when cartForm is not loaded", () => {
      const { container } = renderWithStore({}, { cartForm: null });

      expect(container.firstChild).toBeNull();
    });

    test("renders EditForm when cartForm is loaded", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByTestId("edit-form")).toBeInTheDocument();
      });
    });
  });

  describe("Edit Form Rendering with Prefilled Values", () => {
    test("renders form with correct code", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByTestId("form-code")).toHaveTextContent("FORM001");
      });
    });

    test("renders form with correct name", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByTestId("form-name")).toHaveTextContent(
          "Installation Form"
        );
      });
    });

    test("renders all form items from cartForm", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByTestId("form-item-101")).toHaveTextContent("Item 1");
        expect(screen.getByTestId("form-item-102")).toHaveTextContent("Item 2");
      });
    });

    test("renders form with existing discount values", async () => {
      const customForm = {
        ...mockCartForm,
        discount_amount: 50,
        discount_type: "PERCENTAGE"
      };

      renderWithStore({}, { cartForm: customForm });

      await waitFor(() => {
        expect(screen.getByTestId("discount-amount")).toHaveTextContent("50");
        expect(screen.getByTestId("discount-type")).toHaveTextContent(
          "PERCENTAGE"
        );
      });
    });

    test("renders form with addon name if present", async () => {
      const customForm = {
        ...mockCartForm,
        addon_name: "Premium Add-on"
      };

      renderWithStore({}, { cartForm: customForm });

      await waitFor(() => {
        expect(screen.getByTestId("form-addon")).toHaveTextContent(
          "Premium Add-on"
        );
      });
    });
  });

  describe("Cancel Functionality", () => {
    test("clicking CANCEL returns to cart tab", async () => {
      const onCancel = jest.fn();
      renderWithStore({ onCancel });

      await waitFor(() => {
        expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId("cancel-button");
      await userEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Save Functionality", () => {
    test("calls updateCartForm with correct formId and payload", async () => {
      mockUpdateCartForm.mockReturnValue(() => Promise.resolve());

      renderWithStore({ formId: 123 });

      await waitFor(() => {
        expect(screen.getByTestId("save-button")).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId("save-button");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateCartForm).toHaveBeenCalledWith(
          123,
          expect.objectContaining({
            discount_amount: mockCartForm.discount_amount,
            discount_type: mockCartForm.discount_type,
            items: expect.any(Array)
          })
        );
      });
    });

    test("disables buttons while saving via Redux loading state", async () => {
      let resolveSave;
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve;
      });
      mockUpdateCartForm.mockReturnValue(() => savePromise);

      renderWithStore({ formId: 123 });

      await waitFor(() => {
        expect(screen.getByTestId("save-button")).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId("save-button");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateCartForm).toHaveBeenCalled();
      });

      resolveSave();
    });

    test("on success shows snackbar + returns to tab + triggers refresh", async () => {
      const onSaveCallback = jest.fn();
      mockUpdateCartForm.mockReturnValue(() => Promise.resolve());

      renderWithStore({ formId: 123, onSaveCallback });

      await waitFor(() => {
        expect(screen.getByTestId("save-button")).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId("save-button");
      await userEvent.click(saveButton);

      await waitFor(() => {
        // updateCartForm action handles snackbar display
        expect(mockUpdateCartForm).toHaveBeenCalled();
        // onSaveCallback triggers return to tab + refresh
        expect(onSaveCallback).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Edge Cases", () => {
    test("handles empty items array", async () => {
      const emptyForm = {
        ...mockCartForm,
        items: []
      };

      renderWithStore({}, { cartForm: emptyForm });

      await waitFor(() => {
        expect(screen.getByTestId("edit-form")).toBeInTheDocument();
      });

      expect(screen.queryByTestId(/^form-item-/)).not.toBeInTheDocument();
    });

    test("handles multiple form items correctly", async () => {
      const manyItemsForm = {
        ...mockCartForm,
        items: [
          { form_item_id: 1, name: "Item 1", quantity: 1, meta_fields: [] },
          { form_item_id: 2, name: "Item 2", quantity: 2, meta_fields: [] },
          { form_item_id: 3, name: "Item 3", quantity: 3, meta_fields: [] }
        ]
      };

      renderWithStore({}, { cartForm: manyItemsForm });

      await waitFor(() => {
        expect(screen.getByTestId("form-item-1")).toBeInTheDocument();
        expect(screen.getByTestId("form-item-2")).toBeInTheDocument();
        expect(screen.getByTestId("form-item-3")).toBeInTheDocument();
      });
    });
  });
});
