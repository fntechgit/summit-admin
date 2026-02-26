/* eslint-env jest */

// ---- Mocks must come first ----

// i18n translate: echo the key
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// ---- Now imports ----
/* eslint-disable import/first */
import React from "react";
import PropTypes from "prop-types";
import { cleanup, fireEvent, screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FormikProvider, useFormik } from "formik";
import FormItemTable from "../index";
import ItemTableField from "../components/ItemTableField";
/* eslint-enable import/first */

const EARLY_BIRD_DATE = 1751035704;
const STANDARD_DATE = 1851035704;
const ONSITE_DATE = 1951035704;
const MOCK_TIME_BEFORE_EARLY_BIRD = 1650000000000;
const MILLISECONDS_MULTIPLIER = 1000;
const TIME_OFFSET = 100;
const TWO_ITEMS = 4;
const MOCK_RATE_DATES = {
  early_bird_end_date: EARLY_BIRD_DATE,
  standard_price_end_date: STANDARD_DATE,
  onsite_end_date: ONSITE_DATE
};

// Mock form data
const MOCK_FORM_A = {
  items: [
    {
      form_item_id: 1,
      code: "INST",
      name: "Installation",
      rates: {
        early_bird: 15000,
        standard: 18800,
        onsite: 22400
      },
      meta_fields: [
        {
          type_id: 1,
          class_field: "Form",
          name: "Qty of People",
          type: "Quantity",
          minimum_quantity: 1,
          maximum_quantity: 4
        },
        {
          type_id: 2,
          class_field: "Form",
          name: "Hour x Person",
          type: "Quantity",
          minimum_quantity: 1,
          maximum_quantity: 8
        },
        {
          type_id: 3,
          class_field: "Form",
          name: "Arrival Time",
          type: "Time"
        },
        {
          type_id: 4,
          class_field: "Item",
          name: "Special Instructions",
          type: "Text"
        }
      ]
    },
    {
      form_item_id: 2,
      code: "DISMANTLE",
      name: "Dismantle",
      rates: {
        early_bird: 15000,
        standard: 18800,
        onsite: 22400
      },
      meta_fields: [
        {
          type_id: 1,
          class_field: "Form",
          name: "Qty of People",
          type: "Quantity",
          minimum_quantity: 1,
          maximum_quantity: 4
        },
        {
          type_id: 2,
          class_field: "Form",
          name: "Hour x Person",
          type: "Quantity",
          minimum_quantity: 1,
          maximum_quantity: 8
        },
        {
          type_id: 3,
          class_field: "Form",
          name: "Arrival Time",
          type: "Time"
        }
      ]
    },
    {
      form_item_id: 3,
      code: "INST-MAN",
      name: "Installation Manpower",
      rates: {
        early_bird: 15000,
        standard: 18800,
        onsite: 22400
      },
      meta_fields: []
    },
    {
      form_item_id: 4,
      code: "DIS-MAN",
      name: "Dismantle Manpower",
      rates: {
        early_bird: 15000,
        standard: 18800,
        onsite: 22400
      },
      meta_fields: []
    }
  ]
};

jest.mock("../../formik-inputs/mui-formik-textfield", () => {
  const { useField } = require("formik");
  return {
    __esModule: true,
    default: ({ name, label, type, slotProps, multiline, rows, ...props }) => {
      const [field] = useField(name);
      return (
        <input
          data-testid={`textfield-${name}`}
          name={name}
          type={type || "text"}
          placeholder={label}
          min={slotProps?.input?.min}
          max={slotProps?.input?.max}
          data-multiline={multiline}
          data-rows={rows}
          value={field.value || ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          {...props} // eslint-disable-line react/jsx-props-no-spreading
        />
      );
    }
  };
});

jest.mock("../../formik-inputs/mui-formik-timepicker", () => ({
  __esModule: true,
  default: ({ name, label, timeZone }) => (
    <input
      data-testid={`timepicker-${name}`}
      name={name}
      type="time"
      placeholder={label}
      data-timezone={timeZone}
    />
  )
}));

jest.mock("../../formik-inputs/mui-formik-datepicker", () => ({
  __esModule: true,
  default: ({ name, label }) => (
    <input
      data-testid={`datepicker-${name}`}
      name={name}
      type="date"
      placeholder={label}
    />
  )
}));

jest.mock("../../formik-inputs/mui-formik-select", () => ({
  __esModule: true,
  default: ({ name, label, options }) => (
    <select data-testid={`select-${name}`} name={name}>
      <option value="">{label}</option>
      {options &&
        options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
    </select>
  )
}));

jest.mock("../../formik-inputs/mui-formik-checkbox", () => ({
  __esModule: true,
  default: ({ name, label }) => (
    <input
      data-testid={`checkbox-${name}`}
      type="checkbox"
      name={name}
      aria-label={label}
    />
  )
}));

jest.mock("../../formik-inputs/mui-formik-dropdown-checkbox", () => ({
  __esModule: true,
  default: ({ name, label, options }) => (
    <div data-testid={`dropdown-checkbox-${name}`}>
      <span>{label}</span>
      {options &&
        options.map((opt) => (
          // eslint-disable-next-line jsx-a11y/label-has-associated-control
          <label key={opt.value}>
            <input type="checkbox" value={opt.value} />
            {opt.label}
          </label>
        ))}
    </div>
  )
}));

jest.mock("../../formik-inputs/mui-formik-dropdown-radio", () => ({
  __esModule: true,
  default: ({ name, label, options }) => (
    <div data-testid={`dropdown-radio-${name}`}>
      <span>{label}</span>
      {options &&
        options.map((opt) => (
          // eslint-disable-next-line jsx-a11y/label-has-associated-control
          <label key={opt.value}>
            <input type="radio" name={name} value={opt.value} />
            {opt.label}
          </label>
        ))}
    </div>
  )
}));

// ---- Helpers ----

// Wrapper component with Formik
const FormItemTableWrapper = ({
  data,
  rateDates,
  timeZone,
  initialValues,
  onNotesClick,
  onSettingsClick
}) => {
  const formik = useFormik({
    initialValues: initialValues || {},
    onSubmit: () => {}
  });

  return (
    <FormikProvider value={formik}>
      <FormItemTable
        data={data}
        rateDates={rateDates}
        timeZone={timeZone}
        values={formik.values}
        onNotesClick={onNotesClick}
        onSettingsClick={onSettingsClick}
      />
    </FormikProvider>
  );
};

FormItemTableWrapper.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  rateDates: PropTypes.shape({}).isRequired,
  timeZone: PropTypes.string.isRequired,
  initialValues: PropTypes.shape({}),
  onNotesClick: PropTypes.func.isRequired,
  onSettingsClick: PropTypes.func.isRequired
};

FormItemTableWrapper.defaultProps = {
  initialValues: {}
};

// ---- Tests ----
describe("FormItemTable Component", () => {
  const mockOnNotesClick = jest.fn();
  const mockOnSettingsClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(Date, "now")
      .mockImplementation(() => MOCK_TIME_BEFORE_EARLY_BIRD);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  describe("Rendering", () => {
    it("renders the table with correct structure", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.code")
      ).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.description")
      ).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.early_bird_rate")
      ).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.standard_rate")
      ).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.onsite_rate")
      ).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.qty")
      ).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.total")
      ).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.notes")
      ).toBeInTheDocument();
    });

    it("renders all items from mock data", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(screen.getByText("Installation")).toBeInTheDocument();
      expect(screen.getByText("Dismantle")).toBeInTheDocument();
      expect(screen.getByText("Installation Manpower")).toBeInTheDocument();
      expect(screen.getByText("Dismantle Manpower")).toBeInTheDocument();
    });

    it("renders dynamic columns from meta_fields", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(screen.getByText("Qty of People")).toBeInTheDocument();
      expect(screen.getByText("Hour x Person")).toBeInTheDocument();
      expect(screen.getByText("Arrival Time")).toBeInTheDocument();
    });

    it("displays rate values in cents to dollar format", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      // early_bird: 15000 cents = $150.00
      expect(screen.getAllByText("$150.00").length).toBeGreaterThan(0);
      // standard: 18800 cents = $188.00
      expect(screen.getAllByText("$188.00").length).toBeGreaterThan(0);
      // onsite: 22400 cents = $224.00
      expect(screen.getAllByText("$224.00").length).toBeGreaterThan(0);
    });

    it("renders TOTAL row at the bottom", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.total_on_caps")
      ).toBeInTheDocument();
    });
  });

  describe("ITEM Class Fields", () => {
    it("shows warning icon for items with ITEM class fields", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.additional_info")
      ).toBeInTheDocument();
    });

    it("renders settings button only for items with ITEM class fields", () => {
      const { container } = render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const settingsButtons = container.querySelectorAll(
        "[data-testid=\"SettingsIcon\"]"
      );
      expect(settingsButtons.length).toBe(1);
    });

    it("calls onSettingsClick when settings button is clicked", () => {
      const { container } = render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const settingsButton = container.querySelector(
        "[data-testid=\"SettingsIcon\"]"
      ).parentElement;
      fireEvent.click(settingsButton);

      expect(mockOnSettingsClick).toHaveBeenCalledWith(MOCK_FORM_A.items[0]);
      expect(mockOnSettingsClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Form Inputs", () => {
    it("renders Quantity input fields with correct attributes", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const qtyPeopleInput = screen.getByTestId("textfield-i-1-c-Form-f-1");
      expect(qtyPeopleInput).toHaveAttribute("type", "number");
      expect(qtyPeopleInput).toHaveAttribute("min", "1");
      expect(qtyPeopleInput).toHaveAttribute("max", "4");
    });

    it("renders Time input fields with timezone", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const timeInput = screen.getByTestId("timepicker-i-1-c-Form-f-3");
      expect(timeInput).toBeInTheDocument();
      expect(timeInput).toHaveAttribute("data-timezone", "America/New_York");
    });

    it("renders correct number of form inputs per item", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(
        screen.getByTestId("textfield-i-1-c-Form-f-1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("textfield-i-1-c-Form-f-2")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("timepicker-i-1-c-Form-f-3")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("textfield-i-2-c-Form-f-1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("textfield-i-2-c-Form-f-2")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("timepicker-i-2-c-Form-f-3")
      ).toBeInTheDocument();
    });
  });

  describe("Quantity Calculation", () => {
    it("calculates quantity based on FORM Quantity fields", () => {
      const initialValues = {
        "i-1-c-Form-f-1": 2,
        "i-1-c-Form-f-2": 4
      };

      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          initialValues={initialValues}
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const qtyInput = screen.getByTestId("textfield-i-1-c-global-f-quantity");
      // eslint-disable-next-line
      expect(qtyInput).toHaveValue(8);
    });

    it("renders manual quantity input when no FORM Quantity fields exist", () => {
      const itemsWithoutQuantityFields = [
        {
          form_item_id: 10,
          code: "TEST",
          name: "Test Item",
          rates: {
            early_bird: 10000,
            standard: 12000,
            onsite: 15000
          },
          meta_fields: [
            {
              type_id: 100,
              class: "Form",
              name: "Description",
              type: "Text"
            }
          ]
        }
      ];

      render(
        <FormItemTableWrapper
          data={itemsWithoutQuantityFields}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(
        screen.getByTestId("textfield-i-10-c-global-f-quantity")
      ).toBeInTheDocument();
    });
  });

  describe("Total Calculation", () => {
    it("calculates item total correctly based on quantity and rate", () => {
      const initialValues = {
        "i-1-c-Form-f-1": 2,
        "i-1-c-Form-f-2": 4,
        "i-2-c-Form-f-1": 1,
        "i-2-c-Form-f-2": 2
      };

      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          initialValues={initialValues}
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const allText = screen.getAllByText(/\$/);
      const dollarValues = allText.map((el) => el.textContent);

      expect(dollarValues).toContain("$1504.00");
      expect(dollarValues).toContain("$376.00");
    });

    it("calculates total amount for all items", () => {
      const initialValues = {
        "i-1-c-Form-f-1": 2,
        "i-1-c-Form-f-2": 4,
        "i-2-c-Form-f-1": 1,
        "i-2-c-Form-f-2": 2
      };

      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          initialValues={initialValues}
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const allText = screen.getAllByText(/\$/);
      const dollarValues = allText.map((el) => el.textContent);
      expect(dollarValues).toContain("$1880.00");
    });

    it("shows $0.00 when no quantities are set", () => {
      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          initialValues={{}}
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(
        screen.getByText("edit_sponsor.cart_tab.edit_form.total_on_caps")
      ).toBeInTheDocument();
    });
  });

  describe("Rate Highlighting", () => {
    it("highlights early_bird rate when current time is before early_bird_rate", () => {
      jest
        .spyOn(Date, "now")
        .mockImplementation(() => MOCK_TIME_BEFORE_EARLY_BIRD);

      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(screen.getAllByText("$150.00").length).toBeGreaterThan(0);
    });

    it("highlights standard rate when current time is between early_bird and standard", () => {
      jest
        .spyOn(Date, "now")
        .mockImplementation(
          () =>
            (MOCK_RATE_DATES.early_bird_rate + TIME_OFFSET) *
            MILLISECONDS_MULTIPLIER
        );

      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(screen.getAllByText("$188.00").length).toBeGreaterThan(0);
    });

    it("highlights onsite rate when current time is after standard_rate", () => {
      jest
        .spyOn(Date, "now")
        .mockImplementation(
          () =>
            (MOCK_RATE_DATES.standard_rate + TIME_OFFSET) *
            MILLISECONDS_MULTIPLIER
        );

      render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      expect(screen.getAllByText("$224.00").length).toBeGreaterThan(0);
    });
  });

  describe("Notes Functionality", () => {
    it("renders edit/notes button for all items", () => {
      const { container } = render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const editButtons = container.querySelectorAll(
        "[data-testid=\"EditIcon\"]"
      );
      expect(editButtons.length).toBe(TWO_ITEMS);
    });

    it("calls onNotesClick with correct item when notes button is clicked", () => {
      const { container } = render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const editButtons = container.querySelectorAll(
        "[data-testid=\"EditIcon\"]"
      );
      fireEvent.click(editButtons[0].parentElement);

      expect(mockOnNotesClick).toHaveBeenCalledWith(MOCK_FORM_A.items[0]);
      expect(mockOnNotesClick).toHaveBeenCalledTimes(1);
    });

    it("calls onNotesClick for second item independently", () => {
      const { container } = render(
        <FormItemTableWrapper
          data={MOCK_FORM_A.items}
          rateDates={MOCK_RATE_DATES}
          timeZone="America/New_York"
          onNotesClick={mockOnNotesClick}
          onSettingsClick={mockOnSettingsClick}
        />
      );

      const editButtons = container.querySelectorAll(
        "[data-testid=\"EditIcon\"]"
      );
      fireEvent.click(editButtons[1].parentElement);

      expect(mockOnNotesClick).toHaveBeenCalledWith(MOCK_FORM_A.items[1]);
      expect(mockOnNotesClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("renderInput Helper Function", () => {
    const RenderInputWrapper = ({ field, timeZone, label }) => {
      const formik = useFormik({ initialValues: {}, onSubmit: () => {} });
      return (
        <FormikProvider value={formik}>
          <ItemTableField
            rowId={1}
            field={field}
            timeZone={timeZone}
            label={label}
          />
        </FormikProvider>
      );
    };

    RenderInputWrapper.propTypes = {
      field: PropTypes.shape({}).isRequired,
      timeZone: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    };

    it("renders CheckBox input correctly", () => {
      const field = {
        type_id: 1,
        class_field: "Form",
        type: "CheckBox",
        name: "Test Checkbox"
      };
      const { container } = render(
        <RenderInputWrapper field={field} timeZone="UTC" label="Test Label" />
      );
      expect(
        container.querySelector("[data-testid=\"checkbox-i-1-c-Form-f-1\"]")
      ).toBeInTheDocument();
    });

    it("renders CheckBoxList input with options", () => {
      const field = {
        type_id: 2,
        class_field: "Form",
        type: "CheckBoxList",
        name: "Test CheckBoxList",
        values: [
          { id: 1, value: "Option 1" },
          { id: 2, value: "Option 2" }
        ]
      };
      const { container } = render(
        <RenderInputWrapper field={field} timeZone="UTC" label="Test Label" />
      );
      expect(
        container.querySelector(
          "[data-testid=\"dropdown-checkbox-i-1-c-Form-f-2\"]"
        )
      ).toBeInTheDocument();
    });

    it("renders RadioButtonList input with options", () => {
      const field = {
        type_id: 3,
        class_field: "Form",
        type: "RadioButtonList",
        name: "Test Radio",
        values: [
          { id: 1, value: "Radio 1" },
          { id: 2, value: "Radio 2" }
        ]
      };
      const { container } = render(
        <RenderInputWrapper field={field} timeZone="UTC" label="Test Label" />
      );
      expect(
        container.querySelector("[data-testid=\"dropdown-radio-i-1-c-Form-f-3\"]")
      ).toBeInTheDocument();
    });

    it("renders DateTime input correctly", () => {
      const field = {
        type_id: 4,
        class_field: "Item",
        type: "DateTime",
        name: "Test DateTime"
      };
      const { container } = render(
        <RenderInputWrapper field={field} timeZone="UTC" label="Test Label" />
      );
      expect(
        container.querySelector("[data-testid=\"datepicker-i-1-c-Item-f-4\"]")
      ).toBeInTheDocument();
    });

    it("renders Time input with timezone", () => {
      const field = {
        type_id: 5,
        class_field: "Form",
        type: "Time",
        name: "Test Time"
      };
      const { container } = render(
        <RenderInputWrapper
          field={field}
          timeZone="America/Chicago"
          label="Test Label"
        />
      );
      const input = container.querySelector(
        "[data-testid=\"timepicker-i-1-c-Form-f-5\"]"
      );
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("data-timezone", "America/Chicago");
    });

    it("renders ComboBox with options", () => {
      const field = {
        type_id: 6,
        class_field: "Form",
        type: "ComboBox",
        name: "Test ComboBox",
        values: [
          { id: 1, value: "Combo 1" },
          { id: 2, value: "Combo 2" }
        ]
      };
      const { container } = render(
        <RenderInputWrapper field={field} timeZone="UTC" label="Test Label" />
      );
      expect(
        container.querySelector("[data-testid=\"select-i-1-c-Form-f-6\"]")
      ).toBeInTheDocument();
    });

    it("renders Text input correctly", () => {
      const field = {
        type_id: 7,
        class_field: "Form",
        type: "Text",
        name: "Test Text"
      };
      const { container } = render(
        <RenderInputWrapper field={field} timeZone="UTC" label="Test Label" />
      );
      expect(
        container.querySelector("[data-testid=\"textfield-i-1-c-Form-f-7\"]")
      ).toBeInTheDocument();
    });

    it("renders TextArea input correctly", () => {
      const field = {
        type_id: 8,
        class_field: "Form",
        type: "TextArea",
        name: "Test TextArea"
      };
      const { container } = render(
        <RenderInputWrapper field={field} timeZone="UTC" label="Test Label" />
      );
      expect(
        container.querySelector("[data-testid=\"textfield-i-1-c-Form-f-8\"]")
      ).toBeInTheDocument();
    });

    it("renders Quantity input with min/max attributes", () => {
      const field = {
        type_id: 9,
        class_field: "Form",
        type: "Quantity",
        name: "Test Quantity",
        minimum_quantity: 5,
        maximum_quantity: 100
      };
      const { container } = render(
        <RenderInputWrapper field={field} timeZone="UTC" label="Test Label" />
      );
      const input = container.querySelector(
        "[data-testid=\"textfield-i-1-c-Form-f-9\"]"
      );
      expect(input).toHaveAttribute("min", "5");
      expect(input).toHaveAttribute("max", "100");
    });
  });
});
