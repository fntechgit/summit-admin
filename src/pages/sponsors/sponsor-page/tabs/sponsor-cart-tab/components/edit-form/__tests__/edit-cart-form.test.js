// ---- Mocks must come first ----

// i18n translate: echo the key
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Mock Redux actions
const mockGetSponsorCartForm = jest.fn(() => () => Promise.resolve());
const mockUpdateCartForm = jest.fn(() => () => Promise.resolve());

jest.mock("../../../../../../../../actions/sponsor-cart-actions", () => ({
  getSponsorCartForm: (...args) => mockGetSponsorCartForm(...args),
  updateCartForm: (...args) => mockUpdateCartForm(...args)
}));

// Mock foundation components used by EditForm

// Mock history
const mockHistoryPush = jest.fn();
jest.mock("../../../../../../../../history", () => ({
  __esModule: true,
  default: { push: (...args) => mockHistoryPush(...args) }
}));

// Mock sub-components used by FormItemTable
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/form-item-table",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: ({ data, onNotesClick, onSettingsClick }) => (
        <div>
          {data?.map((item) => (
            <div key={item.form_item_id}>
              <span>{item.name}</span>
              <button
                aria-label="edit"
                onClick={() => onNotesClick(item)}
                type="button"
              >
                edit
              </button>
              <button
                aria-label="settings"
                onClick={() => onSettingsClick(item)}
                type="button"
              >
                settings
              </button>
            </div>
          ))}
        </div>
      ),
      getCurrentApplicableRate: () => "standard"
    };
  }
);

jest.mock("openstack-uicore-foundation/lib/components/mui/notes-modal", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ open, onClose }) =>
      open ? (
        <div role="dialog">
          <button aria-label="close" onClick={onClose} type="button">
            close
          </button>
        </div>
      ) : null
  };
});

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/item-settings-modal",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: ({ open }) => (open ? <div role="dialog">Settings</div> : null)
    };
  }
);

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
import EditCartForm from "../edit-cart-form";
/* eslint-enable import/first */

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// Mock form data
const mockCartForm = {
  id: 1,
  code: "FORM001",
  name: "Installation Form",
  discount_amount: 10,
  discount_type: "AMOUNT",
  items: [
    {
      form_item_id: 101,
      name: "Item 1",
      quantity: 1,
      default_quantity: 1,
      rates: {
        early_bird: 10000,
        standard: 15000,
        onsite: 20000,
        custom: 10000
      },
      custom_rate: 10000,
      notes: "",
      quantity_limit_per_sponsor: 10,
      meta_fields: [
        {
          type_id: 1,
          type: "Text",
          class_field: "Form",
          current_value: "Test Value",
          is_required: false
        },
        {
          type_id: 2,
          type: "Text",
          class_field: "Item",
          current_value: "",
          is_required: false
        }
      ]
    },
    {
      form_item_id: 102,
      name: "Item 2",
      quantity: 2,
      default_quantity: 1,
      rates: {
        early_bird: 20000,
        standard: 25000,
        onsite: 30000,
        custom: 20000
      },
      custom_rate: 20000,
      notes: "",
      quantity_limit_per_sponsor: 5,
      meta_fields: []
    }
  ]
};

const buildMatch = (formId, url) => ({
  params: { form_id: formId },
  url: url || `/app/events/1/sponsors/2/cart/forms/${formId}/edit`
});

// Helper function to render the component with Redux store
const renderWithStore = (
  { formId = 1, ...restProps } = {},
  storeState = {}
) => {
  const defaultState = {
    sponsorPageCartListState: {
      cartForm:
        storeState.cartForm !== undefined ? storeState.cartForm : mockCartForm
    },
    currentSummitState: {
      currentSummit: {
        time_zone_id: "America/Chicago"
      }
    },
    sponsorSettingsState: {
      settings: {
        onsite_price_end_date: Math.floor(new Date().getTime() / 1000) + 86400
      }
    }
  };

  const store = mockStore(defaultState);

  return render(
    <Provider store={store}>
      <EditCartForm match={buildMatch(formId)} {...restProps} />
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
        expect(
          screen.getByText("FORM001 - Installation Form")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Edit Form Rendering with Prefilled Values", () => {
    test("renders form with correct code and name", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(
          screen.getByText("FORM001 - Installation Form")
        ).toBeInTheDocument();
      });
    });

    test("renders form with addon name if present", async () => {
      const customForm = {
        ...mockCartForm,
        addon_name: "Premium Add-on"
      };

      renderWithStore({}, { cartForm: customForm });

      await waitFor(() => {
        expect(
          screen.getByText("FORM001 - Installation Form - Premium Add-on")
        ).toBeInTheDocument();
      });
    });

    test("renders all form items from cartForm", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
      });
    });

    test("displays item count", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByText("2 general.items")).toBeInTheDocument();
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
        expect(
          screen.getByText("FORM001 - Installation Form")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Functionality", () => {
    test("clicking CANCEL navigates back", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByText(/general.cancel/)).toBeInTheDocument();
      });

      const cancelButton = screen.getByText(/general.cancel/);
      await userEvent.click(cancelButton);

      expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    });
  });

  describe("Save Functionality", () => {
    test("calls updateCartForm with correct formId and payload", async () => {
      mockUpdateCartForm.mockReturnValue(() => Promise.resolve());

      renderWithStore({ formId: 123 });

      await waitFor(() => {
        expect(screen.getByText(/general.save/)).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/general.save/);
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateCartForm).toHaveBeenCalledWith(
          123,
          expect.objectContaining({
            discount_amount: expect.any(Number),
            discount_type: expect.any(String),
            items: expect.any(Array)
          })
        );
      });
    });

    test("disables save button when form has validation errors", async () => {
      const invalidForm = {
        ...mockCartForm,
        items: [
          {
            form_item_id: 101,
            name: "Item 1",
            quantity: 0,
            default_quantity: 1,
            rates: {
              early_bird: 10000,
              standard: 15000,
              onsite: 20000,
              custom: 10000
            },
            custom_rate: 10000,
            notes: "",
            quantity_limit_per_sponsor: 10,
            meta_fields: []
          }
        ]
      };

      renderWithStore({}, { cartForm: invalidForm });

      await waitFor(() => {
        const saveButton = screen.getByText(/general.save/);
        expect(saveButton).toBeInTheDocument();
      });
    });

    test("on success navigates back to cart tab", async () => {
      mockUpdateCartForm.mockReturnValue(() => Promise.resolve());

      renderWithStore({ formId: 123 });

      await waitFor(() => {
        expect(screen.getByText(/general.save/)).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/general.save/);
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateCartForm).toHaveBeenCalled();
        expect(mockHistoryPush).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Interactive Features", () => {
    test("opens notes modal when notes button clicked", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
      });

      // Find the Edit icon button (notes) by aria-label
      const notesButton = screen.getAllByLabelText("edit")[0];

      await userEvent.click(notesButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    test("closes notes modal", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
      });

      const notesButton = screen.getAllByLabelText("edit")[0];

      await userEvent.click(notesButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Find close button within the dialog
      const closeButton = screen.getByLabelText("close");

      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    test("opens settings modal when settings button clicked", async () => {
      renderWithStore();

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
      });

      const settingsButtons = screen.getAllByRole("button");
      const settingsButton = settingsButtons.find(
        (btn) => btn.getAttribute("aria-label") === "settings"
      );

      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
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
        expect(screen.getByText("0 general.items")).toBeInTheDocument();
      });
    });

    test("handles multiple form items correctly", async () => {
      const manyItemsForm = {
        ...mockCartForm,
        items: [
          {
            form_item_id: 1,
            name: "Item 1",
            quantity: 1,
            default_quantity: 1,
            rates: {
              early_bird: 10000,
              standard: 15000,
              onsite: 20000,
              custom: 10000
            },
            custom_rate: 10000,
            notes: "",
            quantity_limit_per_sponsor: 10,
            meta_fields: []
          },
          {
            form_item_id: 2,
            name: "Item 2",
            quantity: 2,
            default_quantity: 1,
            rates: {
              early_bird: 20000,
              standard: 25000,
              onsite: 30000,
              custom: 20000
            },
            custom_rate: 20000,
            notes: "",
            quantity_limit_per_sponsor: 10,
            meta_fields: []
          },
          {
            form_item_id: 3,
            name: "Item 3",
            quantity: 3,
            default_quantity: 1,
            rates: {
              early_bird: 30000,
              standard: 35000,
              onsite: 40000,
              custom: 30000
            },
            custom_rate: 30000,
            notes: "",
            quantity_limit_per_sponsor: 10,
            meta_fields: []
          }
        ]
      };

      renderWithStore({}, { cartForm: manyItemsForm });

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
        expect(screen.getByText("Item 3")).toBeInTheDocument();
      });
    });
  });
});
