import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import "@testing-library/jest-dom";
import AdditionalInput from "../formik-inputs/additional-input/additional-input";

// Mocks
jest.mock(
  "../formik-inputs/additional-input/meta-field-values",
  () =>
    function MockMetaFieldValues() {
      return <div data-testid="meta-field-values">MetaFieldValues</div>;
    }
);

// Helper function to render the component with Formik
const renderWithFormik = (props, initialValues = { meta_fields: [] }) =>
  render(
    <Formik initialValues={initialValues} onSubmit={jest.fn()}>
      <Form>
        <AdditionalInput {...props} />
      </Form>
    </Formik>
  );

describe("AdditionalInput", () => {
  const defaultItem = {
    id: 1,
    name: "Test Field",
    type: "",
    is_required: false,
    minimum_quantity: 0,
    maximum_quantity: 0,
    values: []
  };

  const defaultProps = {
    item: defaultItem,
    itemIdx: 0,
    baseName: "meta_fields",
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onDeleteValue: jest.fn(),
    entityId: 1,
    isAddDisabled: false
  };

  const defaultInitialMetaFields = {
    meta_fields: [defaultItem]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders name, type and is_required fields", () => {
      renderWithFormik(defaultProps, defaultInitialMetaFields);

      expect(
        screen.getByPlaceholderText(
          "additional_inputs.placeholders.meta_field_title"
        )
      ).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    test("renders add and delete buttons", () => {
      renderWithFormik(defaultProps, defaultInitialMetaFields);

      expect(
        screen.getByRole("button", { name: /delete/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    });
  });

  describe("Conditional rendering based on type", () => {
    test("shows MetaFieldValues when type is CheckBoxList", () => {
      const itemWithOptions = { ...defaultItem, type: "CheckBoxList" };

      renderWithFormik(
        { ...defaultProps, item: itemWithOptions },
        { meta_fields: [itemWithOptions] }
      );

      expect(screen.getByTestId("meta-field-values")).toBeInTheDocument();
    });

    test("shows MetaFieldValues when type is ComboBox", () => {
      const itemWithOptions = { ...defaultItem, type: "ComboBox" };

      renderWithFormik(
        { ...defaultProps, item: itemWithOptions },
        { meta_fields: [itemWithOptions] }
      );

      expect(screen.getByTestId("meta-field-values")).toBeInTheDocument();
    });

    test("shows MetaFieldValues when type is RadioButtonList", () => {
      const itemWithOptions = { ...defaultItem, type: "RadioButtonList" };

      renderWithFormik(
        { ...defaultProps, item: itemWithOptions },
        { meta_fields: [itemWithOptions] }
      );

      expect(screen.getByTestId("meta-field-values")).toBeInTheDocument();
    });

    test("does not show MetaFieldValues when type is Text", () => {
      renderWithFormik(defaultProps, defaultInitialMetaFields);

      expect(screen.queryByTestId("meta-field-values")).not.toBeInTheDocument();
    });

    test("shows quantity fields when type is Quantity", () => {
      const itemQuantity = { ...defaultItem, type: "Quantity" };

      renderWithFormik(
        { ...defaultProps, item: itemQuantity },
        { meta_fields: [itemQuantity] }
      );

      expect(
        screen.getByPlaceholderText(
          "additional_inputs.placeholders.meta_field_minimum_quantity"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          "additional_inputs.placeholders.meta_field_maximum_quantity"
        )
      ).toBeInTheDocument();
    });

    test("does not show quantity fields when type is not Quantity", () => {
      renderWithFormik(defaultProps, defaultInitialMetaFields);

      expect(
        screen.queryByPlaceholderText(
          "additional_inputs.placeholders.meta_field_minimum_quantity"
        )
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(
          "additional_inputs.placeholders.meta_field_maximum_quantity"
        )
      ).not.toBeInTheDocument();
    });
  });

  describe("Button interactions", () => {
    test("calls onDelete with item and index when delete button is clicked", async () => {
      const mockOnDelete = jest.fn();

      renderWithFormik(
        { ...defaultProps, onDelete: mockOnDelete },
        defaultInitialMetaFields
      );

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await userEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(defaultItem, 0);
    });

    test("calls onAdd when add button is clicked", async () => {
      const mockOnAdd = jest.fn();

      renderWithFormik(
        { ...defaultProps, onAdd: mockOnAdd },
        defaultInitialMetaFields
      );

      const addButton = screen.getByRole("button", { name: /add/i });
      await userEvent.click(addButton);

      expect(mockOnAdd).toHaveBeenCalled();
    });

    test("disables add button when isAddDisabled is true", () => {
      renderWithFormik(
        { ...defaultProps, isAddDisabled: true },
        defaultInitialMetaFields
      );

      const addButton = screen.getByRole("button", { name: /add/i });
      expect(addButton).toBeDisabled();
    });

    test("enables add button when isAddDisabled is false", () => {
      renderWithFormik(
        { ...defaultProps, isAddDisabled: false },
        defaultInitialMetaFields
      );

      const addButton = screen.getByRole("button", { name: /add/i });
      expect(addButton).not.toBeDisabled();
    });
  });

  describe("Error display", () => {
    test("shows values error when touched and has error", () => {
      const itemWithOptions = { ...defaultItem, type: "CheckBoxList" };

      render(
        <Formik
          initialValues={{ meta_fields: [itemWithOptions] }}
          initialErrors={{
            meta_fields: [{ values: "At least one option required" }]
          }}
          initialTouched={{ meta_fields: [{ values: true }] }}
          onSubmit={jest.fn()}
        >
          <Form>
            <AdditionalInput {...defaultProps} item={itemWithOptions} />
          </Form>
        </Formik>
      );

      expect(
        screen.getByText("At least one option required")
      ).toBeInTheDocument();
    });

    test("does not show values error when not touched", () => {
      const itemWithOptions = { ...defaultItem, type: "CheckBoxList" };

      render(
        <Formik
          initialValues={{ meta_fields: [itemWithOptions] }}
          initialErrors={{
            meta_fields: [{ values: "At least one option required" }]
          }}
          initialTouched={{ meta_fields: [{ values: false }] }}
          onSubmit={jest.fn()}
        >
          <Form>
            <AdditionalInput {...defaultProps} item={itemWithOptions} />
          </Form>
        </Formik>
      );

      expect(
        screen.queryByText("At least one option required")
      ).not.toBeInTheDocument();
    });
  });
});
