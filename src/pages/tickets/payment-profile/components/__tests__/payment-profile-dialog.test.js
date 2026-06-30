/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from "@testing-library/react";
import PaymentProfileDialog from "../payment-profile-dialog";

jest.mock("../../../../../hooks/useScrollToError", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Renders each row applying the column render functions — needed for table display tests
jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function MockMuiTable({ columns, data, onEdit }) {
      return (
        <table data-testid="fee-types-table">
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id} data-testid={`row-${row.id}`}>
                {columns.map((col) => (
                  <td
                    key={col.columnKey}
                    data-testid={`cell-${col.columnKey}-${i}`}
                  >
                    {col.render ? col.render(row) : row[col.columnKey]}
                  </td>
                ))}
                {onEdit && (
                  <td>
                    <button
                      data-testid={`edit-row-${row.id}`}
                      onClick={() => onEdit(row)}
                    >
                      edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };
});

// Native <select> connected to Formik so fireEvent.change updates the field
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/select",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikSelect({ name, children, ...props }) {
        const [field, meta] = useField(name);
        return (
          <>
            <select data-testid={`select-${name}`} {...field} {...props}>
              <option value="" />
              {React.Children.map(children, (child) =>
                child ? (
                  <option value={child.props.value}>
                    {child.props.children}
                  </option>
                ) : null
              )}
            </select>
            {meta.touched && meta.error && <span>{meta.error}</span>}
          </>
        );
      }
    };
  }
);

// Native <input> connected to Formik so validation error messages surface
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikTextField({ name, ...props }) {
        const [field, meta] = useField(name);
        return (
          <>
            <input data-testid={`input-${name}`} {...field} {...props} />
            {meta.touched && meta.error && <span>{meta.error}</span>}
          </>
        );
      }
    };
  }
);

// Native <input type="number"> connected to Formik — distinguishable from the Rate TextField
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/price-field",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikPriceField({ name, ...props }) {
        const [field, meta] = useField(name);
        return (
          <>
            <input
              data-testid={`price-${name}`}
              type="number"
              {...field}
              {...props}
            />
            {meta.touched && meta.error && <span>{meta.error}</span>}
          </>
        );
      }
    };
  }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikCheckbox({ name, ...props }) {
        const [field] = useField({ name, type: "checkbox" });
        return (
          <input
            data-testid={`checkbox-${name}`}
            type="checkbox"
            {...field}
            {...props}
          />
        );
      }
    };
  }
);

// Entity that satisfies the three conditions to show the fee type section:
// id !== 0, provider === "Stripe", application_type === "SponsorServices"
const feeTypeSectionEntity = {
  id: 1,
  application_type: "SponsorServices",
  provider: "Stripe",
  is_active: true,
  test_mode_enabled: false,
  send_email_receipt: false,
  merchant_account_id: "",
  live_secret_key: "sk_live_xxx",
  live_publishable_key: "pk_live_xxx",
  test_secret_key: "",
  test_publishable_key: ""
};

const rateFeeType = {
  id: 1,
  name: "Processing Fee",
  kind: "Rate",
  payment_method: "card",
  value: 250, // 2.5% — stored as basis points (value / 100)
  max_cents: 0,
  min_cents: 0
};

const amountFeeType = {
  id: 2,
  name: "Flat Fee",
  kind: "Amount",
  payment_method: "card",
  value: 1500, // $15.00 — stored in cents
  max_cents: 0,
  min_cents: 0
};

const defaultPaymentFeeTypes = {
  paymentFeeTypes: [],
  totalPaymentFeeTypes: 0,
  order: "id",
  orderDir: 1
};

const defaultProps = {
  onSave: jest.fn().mockResolvedValue({}),
  onClose: jest.fn(),
  onSaveFeeType: jest.fn().mockResolvedValue({}),
  onDeleteFeeType: jest.fn().mockResolvedValue({}),
  entity: {},
  paymentFeeTypes: defaultPaymentFeeTypes
};

const renderDialog = (props = {}) =>
  render(<PaymentProfileDialog {...defaultProps} {...props} />);

const openFeeTypeForm = () => {
  fireEvent.click(screen.getByRole("button", { name: /new_fee_type/i }));
};

const submitFeeTypeForm = () => {
  fireEvent.click(screen.getByRole("button", { name: /save_fee_type/i }));
};

const submitProfileForm = () => {
  fireEvent.click(screen.getByRole("button", { name: "general.save" }));
};

describe("PaymentProfileDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps.onSave.mockResolvedValue({});
    defaultProps.onSaveFeeType.mockResolvedValue({});
  });

  describe("payment profile form", () => {
    test("submitting with empty required fields shows validation errors and does not call onSave", async () => {
      renderDialog({ entity: {} });
      submitProfileForm();

      await waitFor(() => {
        // application_type and provider are the two required fields
        expect(screen.getAllByText("validation.required")).toHaveLength(2);
      });
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    test("submitting with all required fields filled calls onSave then onClose", async () => {
      renderDialog({ entity: {} });

      fireEvent.change(screen.getByTestId("select-application_type"), {
        target: { value: "Registration" }
      });
      fireEvent.change(screen.getByTestId("select-provider"), {
        target: { value: "Stripe" }
      });
      submitProfileForm();

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            application_type: "Registration",
            provider: "Stripe"
          })
        );
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    test("provider selection shows the correct provider-specific fields", () => {
      renderDialog({ entity: {} });

      fireEvent.change(screen.getByTestId("select-provider"), {
        target: { value: "LawPay" }
      });
      expect(
        screen.getByTestId("input-merchant_account_id")
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("checkbox-send_email_receipt")
      ).not.toBeInTheDocument();

      fireEvent.change(screen.getByTestId("select-provider"), {
        target: { value: "Stripe" }
      });
      expect(
        screen.getByTestId("checkbox-send_email_receipt")
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("input-merchant_account_id")
      ).not.toBeInTheDocument();
    });
  });

  describe("fee type table value display", () => {
    const paymentFeeTypes = {
      paymentFeeTypes: [rateFeeType, amountFeeType],
      totalPaymentFeeTypes: 2,
      order: "id",
      orderDir: 1
    };

    test("renders fee type rows with correct names and formatted values", () => {
      renderDialog({ entity: feeTypeSectionEntity, paymentFeeTypes });

      expect(screen.getByTestId("fee-types-table")).toBeInTheDocument();
      expect(screen.getByTestId("row-1")).toBeInTheDocument();
      expect(screen.getByTestId("row-2")).toBeInTheDocument();
      expect(screen.getByTestId("cell-name-0")).toHaveTextContent(
        "Processing Fee"
      );
      expect(screen.getByTestId("cell-name-1")).toHaveTextContent("Flat Fee");
      // rateFeeType: value = 250 → 250/100 = 2.5%
      expect(screen.getByTestId("cell-value-0")).toHaveTextContent("2.5%");
      // amountFeeType: value = 1500 cents → $15.00
      expect(screen.getByTestId("cell-value-1")).toHaveTextContent("$15.00");
    });

    test.each([
      ["profile is new (id = 0)", { id: 0 }],
      ["provider is not Stripe", { provider: "LawPay" }],
      [
        "application type is not SponsorServices",
        { application_type: "Registration" }
      ]
    ])("does not render the table when the %s", (_, override) => {
      renderDialog({
        entity: { ...feeTypeSectionEntity, ...override },
        paymentFeeTypes
      });

      expect(screen.queryByTestId("fee-types-table")).not.toBeInTheDocument();
    });
  });

  describe("fee type validations", () => {
    beforeEach(() => {
      renderDialog({ entity: feeTypeSectionEntity });
      openFeeTypeForm();
    });

    test("submitting empty form shows required error for name, kind, and payment_method", async () => {
      submitFeeTypeForm();

      // Formik validation is async — wait for errors to appear
      await waitFor(() => {
        expect(screen.getAllByText("validation.required")).toHaveLength(3);
      });
    });

    test("Rate kind: value of 0 (below minimum) shows minimum validation error", async () => {
      fireEvent.change(screen.getByTestId("select-kind"), {
        target: { value: "Rate" }
      });
      // value stays at the initial 0, which is below the Rate minimum of 1
      submitFeeTypeForm();

      await waitFor(() => {
        expect(screen.getByText("validation.minimum")).toBeInTheDocument();
      });
    });

    test("Rate kind: value above maximum shows maximum validation error", async () => {
      fireEvent.change(screen.getByTestId("select-kind"), {
        target: { value: "Rate" }
      });

      // The Rate value field is a real MUI TextField (no data-testid).
      // Find it as the only spinbutton not coming from the mocked price fields.
      const valueInput = screen
        .getAllByRole("spinbutton")
        .find((el) => !el.hasAttribute("data-testid"));

      // Typing "200" → stored as Math.round(200 * 100) = 20000, which exceeds TEN_THOUSAND (10000)
      fireEvent.change(valueInput, { target: { value: "200" } });
      submitFeeTypeForm();

      await waitFor(() => {
        expect(screen.getByText("validation.maximum")).toBeInTheDocument();
      });
    });
  });

  describe("fee type kind field behavior", () => {
    beforeEach(() => {
      renderDialog({ entity: feeTypeSectionEntity });
      openFeeTypeForm();
    });

    test("kind selection renders price field for Amount and percentage input for Rate", () => {
      fireEvent.change(screen.getByTestId("select-kind"), {
        target: { value: "Amount" }
      });
      expect(screen.getByTestId("price-value")).toBeInTheDocument();

      fireEvent.change(screen.getByTestId("select-kind"), {
        target: { value: "Rate" }
      });
      expect(screen.queryByTestId("price-value")).not.toBeInTheDocument();
      expect(screen.getByText("%")).toBeInTheDocument();
    });

    test("changing kind resets value to 0", async () => {
      // Set kind to Rate and enter a value
      fireEvent.change(screen.getByTestId("select-kind"), {
        target: { value: "Rate" }
      });
      const valueInput = screen
        .getAllByRole("spinbutton")
        .find((el) => !el.hasAttribute("data-testid"));
      fireEvent.change(valueInput, { target: { value: "20" } });

      // Switch to Amount — value should be reset
      fireEvent.change(screen.getByTestId("select-kind"), {
        target: { value: "Amount" }
      });

      // price-value is the Amount field; its formik value should be 0
      await waitFor(() => {
        expect(screen.getByTestId("price-value")).toHaveValue(0);
      });
    });
  });

  describe("isSaving behavior", () => {
    test("close button calls onClose when not saving", () => {
      renderDialog({ entity: {} });
      fireEvent.click(screen.getByRole("button", { name: "close" }));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test("save and close buttons are both disabled while a save is in flight", async () => {
      let resolveOnSave;
      defaultProps.onSave.mockReturnValue(
        new Promise((r) => {
          resolveOnSave = r;
        })
      );

      renderDialog({ entity: {} });
      fireEvent.change(screen.getByTestId("select-application_type"), {
        target: { value: "Registration" }
      });
      fireEvent.change(screen.getByTestId("select-provider"), {
        target: { value: "Stripe" }
      });
      submitProfileForm();

      await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalled());

      expect(
        screen.getByRole("button", { name: "general.save" })
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "close" })).toBeDisabled();

      await act(async () => {
        resolveOnSave({});
      });
    });

    test("re-enables buttons and does not call onClose after save rejects", async () => {
      defaultProps.onSave.mockRejectedValue(new Error("save failed"));

      renderDialog({ entity: {} });
      fireEvent.change(screen.getByTestId("select-application_type"), {
        target: { value: "Registration" }
      });
      fireEvent.change(screen.getByTestId("select-provider"), {
        target: { value: "Stripe" }
      });
      submitProfileForm();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "general.save" })
        ).not.toBeDisabled();
      });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe("fee type form actions", () => {
    const fillValidFeeTypeForm = async () => {
      fireEvent.change(screen.getByTestId("input-name"), {
        target: { value: "Processing Fee" }
      });
      fireEvent.change(screen.getByTestId("select-kind"), {
        target: { value: "Amount" }
      });
      fireEvent.change(screen.getByTestId("select-payment_method"), {
        target: { value: "card" }
      });
      await waitFor(() =>
        expect(screen.getByTestId("price-value")).toBeInTheDocument()
      );
      fireEvent.change(screen.getByTestId("price-value"), {
        target: { value: 1500 }
      });
    };

    beforeEach(() => {
      renderDialog({ entity: feeTypeSectionEntity });
      openFeeTypeForm();
    });

    test("submitting a valid fee type form calls onSaveFeeType and hides the form", async () => {
      await fillValidFeeTypeForm();
      submitFeeTypeForm();

      await waitFor(() => {
        expect(defaultProps.onSaveFeeType).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Processing Fee",
            kind: "Amount",
            payment_method: "card"
          })
        );
        expect(
          screen.queryByRole("button", { name: /save_fee_type/i })
        ).not.toBeInTheDocument();
      });
    });

    test("cancel hides the form without calling onSaveFeeType", () => {
      fireEvent.click(screen.getByRole("button", { name: /general.cancel/i }));

      expect(
        screen.queryByRole("button", { name: /save_fee_type/i })
      ).not.toBeInTheDocument();
      expect(defaultProps.onSaveFeeType).not.toHaveBeenCalled();
    });
  });

  describe("fee type edit", () => {
    test("clicking edit on a row opens and pre-fills the form with that fee type", async () => {
      renderDialog({
        entity: feeTypeSectionEntity,
        paymentFeeTypes: {
          paymentFeeTypes: [rateFeeType],
          totalPaymentFeeTypes: 1,
          order: "id",
          orderDir: 1
        }
      });

      fireEvent.click(screen.getByTestId(`edit-row-${rateFeeType.id}`));

      await waitFor(() => {
        expect(screen.getByTestId("input-name")).toHaveValue(rateFeeType.name);
      });
      expect(screen.getByTestId("select-kind")).toHaveValue(rateFeeType.kind);
      expect(screen.getByTestId("select-payment_method")).toHaveValue(
        rateFeeType.payment_method
      );
    });
  });
});
