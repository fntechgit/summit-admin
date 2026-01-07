import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form, useFormikContext } from "formik";
import "@testing-library/jest-dom";
import MetaFieldValues from "../formik-inputs/additional-input/meta-field-values";
import showConfirmDialog from "../showConfirmDialog";

// Mocks
jest.mock("../showConfirmDialog", () => jest.fn());

jest.mock(
  "../dnd-list",
  () =>
    function MockDragAndDropList({ items, renderItem }) {
      return (
        <div data-testid="dnd-list">
          {items.map((item, index) => (
            <div key={item.id || index} data-testid={`dnd-item-${index}`}>
              {renderItem(item, index, {}, { isDragging: false })}
            </div>
          ))}
        </div>
      );
    }
);

// Helper function to render the component with Formik
const renderWithFormik = (props, initialValues = { meta_fields: [] }) =>
  render(
    <Formik initialValues={initialValues} onSubmit={jest.fn()}>
      <Form>
        <MetaFieldValues {...props} />
      </Form>
    </Formik>
  );

describe("MetaFieldValues", () => {
  const defaultField = {
    id: 1,
    name: "Test Field",
    type: "CheckBoxList",
    values: [
      { id: 101, name: "Option 1", value: "opt1", is_default: false, order: 1 },
      { id: 102, name: "Option 2", value: "opt2", is_default: true, order: 2 }
    ]
  };

  const defaultProps = {
    field: defaultField,
    fieldIndex: 0,
    baseName: "meta_fields",
    onMetaFieldTypeValueDeleted: jest.fn(),
    entityId: 1
  };

  const defaultInitialValues = {
    meta_fields: [defaultField]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders all field values sorted by order prop", () => {
      const fieldWithUnorderedValues = {
        ...defaultField,
        values: [
          { id: 103, name: "Option 3", value: "opt3", order: 3 },
          { id: 101, name: "Option 1", value: "opt1", order: 1 },
          { id: 102, name: "Option 2", value: "opt2", order: 2 }
        ]
      };

      renderWithFormik(
        { ...defaultProps, field: fieldWithUnorderedValues },
        { meta_fields: [fieldWithUnorderedValues] }
      );

      // verify all values are rendered
      const items = screen.getAllByPlaceholderText(
        "edit_inventory_item.placeholders.meta_field_name"
      );
      expect(items).toHaveLength(3);

      // verify the values are rendered using the order prop
      expect(items[0]).toHaveValue("Option 1");
      expect(items[1]).toHaveValue("Option 2");
      expect(items[2]).toHaveValue("Option 3");
    });
  });

  describe("handleAddValue", () => {
    test("adds a new empty value when add button is clicked", async () => {
      // Componente wrapper que sincroniza field con Formik
      const TestWrapper = () => {
        const { values } = useFormikContext();
        const field = values.meta_fields[0];
        return (
          <MetaFieldValues
            field={field}
            fieldIndex={0}
            baseName="meta_fields"
            onMetaFieldTypeValueDeleted={jest.fn()}
            entityId={1}
          />
        );
      };

      render(
        <Formik initialValues={defaultInitialValues} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper />
          </Form>
        </Formik>
      );

      // Verificar cantidad inicial
      const initialInputs = screen.getAllByPlaceholderText(
        "edit_inventory_item.placeholders.meta_field_name"
      );
      expect(initialInputs).toHaveLength(2);

      // Click en agregar
      const addButton = screen.getByRole("button", { name: /add/i });
      await userEvent.click(addButton);

      // Esperar actualización
      await waitFor(() => {
        const updatedInputs = screen.getAllByPlaceholderText(
          "edit_inventory_item.placeholders.meta_field_name"
        );
        expect(updatedInputs).toHaveLength(3);
      });
    });
  });

  describe("isMetafieldValueIncomplete", () => {
    test("disables add button when a value name is empty", () => {
      const fieldWithIncomplete = {
        ...defaultField,
        values: [
          { id: 101, name: "", value: "opt1", is_default: false, order: 1 }
        ]
      };

      renderWithFormik(
        { ...defaultProps, field: fieldWithIncomplete },
        { meta_fields: [fieldWithIncomplete] }
      );

      const addButton = screen.getByRole("button", { name: /add/i });
      expect(addButton).toBeDisabled();
    });

    test("disables add button when a value is empty", () => {
      const fieldWithIncomplete = {
        ...defaultField,
        values: [
          { id: 101, name: "Option", value: "", is_default: false, order: 1 }
        ]
      };

      renderWithFormik(
        { ...defaultProps, field: fieldWithIncomplete },
        { meta_fields: [fieldWithIncomplete] }
      );

      const addButton = screen.getByRole("button", { name: /add/i });
      expect(addButton).toBeDisabled();
    });

    test("enables add button when all values are complete", () => {
      renderWithFormik(defaultProps, defaultInitialValues);

      const addButton = screen.getByRole("button", { name: /add/i });
      expect(addButton).not.toBeDisabled();
    });

    test("enables add button when there are no values", () => {
      const fieldWithNoValues = { ...defaultField, values: [] };

      renderWithFormik(
        { ...defaultProps, field: fieldWithNoValues },
        { meta_fields: [fieldWithNoValues] }
      );

      const addButton = screen.getByRole("button", { name: /add/i });
      expect(addButton).not.toBeDisabled();
    });
  });

  describe("handleDefaultChange", () => {
    test("only one value can be default at a time", async () => {
      renderWithFormik(defaultProps, defaultInitialValues);

      const checkboxes = screen.getAllByRole("checkbox");

      // Option 2 is default
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[0]).not.toBeChecked();

      // click on Option 1
      await userEvent.click(checkboxes[0]);

      // Option 1 should be checked and Option 2 unchecked
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  describe("handleRemoveValue", () => {
    test("shows confirmation dialog when remove is clicked", async () => {
      showConfirmDialog.mockResolvedValue(false);
      renderWithFormik(defaultProps, defaultInitialValues);

      const closeIcons = screen.getAllByTestId("CloseIcon");
      const closeButton = closeIcons[0].closest("button");
      await userEvent.click(closeButton);

      expect(showConfirmDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          type: "warning"
        })
      );
    });

    test("calls API and removes from UI when value has id", async () => {
      const mockOnDelete = jest.fn().mockResolvedValue();
      showConfirmDialog.mockResolvedValue(true);

      const TestWrapper = ({ onDelete }) => {
        const { values } = useFormikContext();
        const field = values.meta_fields[0];
        return (
          <MetaFieldValues
            field={field}
            fieldIndex={0}
            baseName="meta_fields"
            onMetaFieldTypeValueDeleted={onDelete}
            entityId={1}
          />
        );
      };

      render(
        <Formik initialValues={defaultInitialValues} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper onDelete={mockOnDelete} />
          </Form>
        </Formik>
      );

      expect(screen.getAllByTestId("CloseIcon")).toHaveLength(2);

      const closeButton = screen
        .getAllByTestId("CloseIcon")[0]
        .closest("button");
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(1, 1, 101);
        expect(screen.getAllByTestId("CloseIcon")).toHaveLength(1);
      });
    });

    test("removes from UI without API call when value has no id", async () => {
      const mockOnDelete = jest.fn();
      showConfirmDialog.mockResolvedValue(true);

      const fieldWithoutIds = {
        ...defaultField,
        values: [
          { name: "Option 1", value: "opt1", is_default: false, order: 1 },
          { name: "Option 2", value: "opt2", is_default: false, order: 2 }
        ]
      };

      const TestWrapper = ({ onDelete }) => {
        const { values } = useFormikContext();
        const field = values.meta_fields[0];
        return (
          <MetaFieldValues
            field={field}
            fieldIndex={0}
            baseName="meta_fields"
            onMetaFieldTypeValueDeleted={onDelete}
            entityId={1}
          />
        );
      };

      render(
        <Formik
          initialValues={{ meta_fields: [fieldWithoutIds] }}
          onSubmit={jest.fn()}
        >
          <Form>
            <TestWrapper onDelete={mockOnDelete} />
          </Form>
        </Formik>
      );

      expect(screen.getAllByTestId("CloseIcon")).toHaveLength(2);

      const closeButton = screen
        .getAllByTestId("CloseIcon")[0]
        .closest("button");
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnDelete).not.toHaveBeenCalled();
        expect(screen.getAllByTestId("CloseIcon")).toHaveLength(1);
      });
    });
  });
});
