import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form, useFormikContext } from "formik";
import "@testing-library/jest-dom";
import AdditionalInputList from "../formik-inputs/additional-input/additional-input-list";
import showConfirmDialog from "../showConfirmDialog";

// Mocks
jest.mock("../showConfirmDialog", () => jest.fn());

jest.mock(
  "../formik-inputs/additional-input/additional-input",
  () =>
    function MockAdditionalInput({
      item,
      itemIdx,
      onAdd,
      onDelete,
      isAddDisabled
    }) {
      return (
        <div data-testid={`additional-input-${itemIdx}`}>
          <span data-testid={`item-name-${itemIdx}`}>{item.name}</span>
          <span data-testid={`item-type-${itemIdx}`}>{item.type}</span>
          <button
            data-testid={`add-btn-${itemIdx}`}
            onClick={onAdd}
            disabled={isAddDisabled}
          >
            Add
          </button>
          <button
            data-testid={`delete-btn-${itemIdx}`}
            onClick={() => onDelete(item, itemIdx)}
          >
            Delete
          </button>
        </div>
      );
    }
);

// Helper function to render the component with Formik
const renderWithFormik = (props, initialValues = { meta_fields: [] }) =>
  render(
    <Formik initialValues={initialValues} onSubmit={jest.fn()}>
      <Form>
        <AdditionalInputList {...props} />
      </Form>
    </Formik>
  );

describe("AdditionalInputList", () => {
  const defaultMetaField = {
    id: 1,
    name: "Field 1",
    type: "Text",
    is_required: false,
    minimum_quantity: 0,
    maximum_quantity: 0,
    values: []
  };

  const defaultProps = {
    name: "meta_fields",
    onDelete: jest.fn(),
    onDeleteValue: jest.fn(),
    entityId: 1
  };

  const defaultInitialValues = {
    meta_fields: [defaultMetaField]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders an AdditionalInput for each meta field", () => {
      const multipleFields = {
        meta_fields: [
          { ...defaultMetaField, id: 1, name: "Field 1" },
          { ...defaultMetaField, id: 2, name: "Field 2" },
          { ...defaultMetaField, id: 3, name: "Field 3" }
        ]
      };

      renderWithFormik(defaultProps, multipleFields);

      expect(screen.getByTestId("additional-input-0")).toBeInTheDocument();
      expect(screen.getByTestId("additional-input-1")).toBeInTheDocument();
      expect(screen.getByTestId("additional-input-2")).toBeInTheDocument();
      expect(screen.getByTestId("item-name-0")).toHaveTextContent("Field 1");
      expect(screen.getByTestId("item-name-1")).toHaveTextContent("Field 2");
      expect(screen.getByTestId("item-name-2")).toHaveTextContent("Field 3");
    });

    test("renders a default metafield when meta_fields is empty", () => {
      renderWithFormik(defaultProps, { meta_fields: [] });

      // Should render one default empty field
      expect(screen.getByTestId("additional-input-0")).toBeInTheDocument();
      expect(screen.getByTestId("item-name-0")).toHaveTextContent("");
      expect(screen.getByTestId("item-type-0")).toHaveTextContent("");
    });
  });

  describe("handleAddItem", () => {
    test("adds a new empty meta field when onAdd is called", async () => {
      const TestWrapper = () => {
        const { values } = useFormikContext();
        return (
          <>
            <AdditionalInputList {...defaultProps} />
            <div data-testid="field-count">{values.meta_fields.length}</div>
          </>
        );
      };

      render(
        <Formik initialValues={defaultInitialValues} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper />
          </Form>
        </Formik>
      );

      expect(screen.getByTestId("field-count")).toHaveTextContent("1");

      const addButton = screen.getByTestId("add-btn-0");
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId("field-count")).toHaveTextContent("2");
      });
    });
  });

  describe("handleRemove", () => {
    test("shows confirmation dialog when delete is clicked", async () => {
      showConfirmDialog.mockResolvedValue(false);

      renderWithFormik(defaultProps, defaultInitialValues);

      const deleteButton = screen.getByTestId("delete-btn-0");
      await userEvent.click(deleteButton);

      expect(showConfirmDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          type: "warning"
        })
      );
    });

    test("calls API and removes from UI when item has id", async () => {
      const mockOnDelete = jest.fn().mockResolvedValue();
      showConfirmDialog.mockResolvedValue(true);

      const TestWrapper = ({ onDelete }) => {
        const { values } = useFormikContext();
        return (
          <>
            <AdditionalInputList {...defaultProps} onDelete={onDelete} />
            <div data-testid="field-count">{values.meta_fields.length}</div>
          </>
        );
      };

      render(
        <Formik initialValues={defaultInitialValues} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper onDelete={mockOnDelete} />
          </Form>
        </Formik>
      );

      expect(screen.getByTestId("field-count")).toHaveTextContent("1");

      const deleteButton = screen.getByTestId("delete-btn-0");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(1, 1); // entityId, item.id
      });
    });

    test("removes from UI without API call when item has no id", async () => {
      const mockOnDelete = jest.fn();
      showConfirmDialog.mockResolvedValue(true);

      const fieldWithoutId = {
        name: "New Field",
        type: "Text",
        is_required: false,
        values: []
      };

      const TestWrapper = ({ onDelete }) => {
        const { values } = useFormikContext();
        return (
          <>
            <AdditionalInputList {...defaultProps} onDelete={onDelete} />
            <div data-testid="field-count">{values.meta_fields.length}</div>
          </>
        );
      };

      render(
        <Formik
          initialValues={{ meta_fields: [defaultMetaField, fieldWithoutId] }}
          onSubmit={jest.fn()}
        >
          <Form>
            <TestWrapper onDelete={mockOnDelete} />
          </Form>
        </Formik>
      );

      expect(screen.getByTestId("field-count")).toHaveTextContent("2");

      // remove the second field (without id)
      const deleteButton = screen.getByTestId("delete-btn-1");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).not.toHaveBeenCalled();
        expect(screen.getByTestId("field-count")).toHaveTextContent("1");
      });
    });

    test("resets to default meta field when last item is deleted", async () => {
      const mockOnDelete = jest.fn().mockResolvedValue();
      showConfirmDialog.mockResolvedValue(true);

      const TestWrapper = ({ onDelete }) => {
        const { values } = useFormikContext();
        return (
          <>
            <AdditionalInputList {...defaultProps} onDelete={onDelete} />
            <div data-testid="field-count">{values.meta_fields.length}</div>
            <div data-testid="first-field-name">
              {values.meta_fields[0]?.name || "empty"}
            </div>
          </>
        );
      };

      render(
        <Formik initialValues={defaultInitialValues} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper onDelete={mockOnDelete} />
          </Form>
        </Formik>
      );

      const deleteButton = screen.getByTestId("delete-btn-0");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        // should still have 1 field (the default empty one)
        expect(screen.getByTestId("field-count")).toHaveTextContent("1");
        // field should be reset to empty
        expect(screen.getByTestId("first-field-name")).toHaveTextContent(
          "empty"
        );
      });
    });
  });

  describe("areMetafieldsIncomplete", () => {
    test("disables add button when name is empty", () => {
      const fieldWithEmptyName = { ...defaultMetaField, name: "" };

      renderWithFormik(defaultProps, { meta_fields: [fieldWithEmptyName] });

      expect(screen.getByTestId("add-btn-0")).toBeDisabled();
    });

    test("disables add button when type is empty", () => {
      const fieldWithEmptyType = {
        ...defaultMetaField,
        name: "Field",
        type: ""
      };

      renderWithFormik(defaultProps, { meta_fields: [fieldWithEmptyType] });

      expect(screen.getByTestId("add-btn-0")).toBeDisabled();
    });

    test("disables add button when type with options has no values", () => {
      const fieldWithNoValues = {
        ...defaultMetaField,
        name: "Field",
        type: "CheckBoxList",
        values: []
      };

      renderWithFormik(defaultProps, { meta_fields: [fieldWithNoValues] });

      expect(screen.getByTestId("add-btn-0")).toBeDisabled();
    });

    test("disables add button when values are incomplete", () => {
      const fieldWithIncompleteValues = {
        ...defaultMetaField,
        name: "Field",
        type: "ComboBox",
        values: [{ name: "Option", value: "" }] // value is empty
      };

      renderWithFormik(defaultProps, {
        meta_fields: [fieldWithIncompleteValues]
      });

      expect(screen.getByTestId("add-btn-0")).toBeDisabled();
    });

    test("enables add button when all fields are complete", () => {
      const completeField = {
        ...defaultMetaField,
        name: "Field",
        type: "Text"
      };

      renderWithFormik(defaultProps, { meta_fields: [completeField] });

      expect(screen.getByTestId("add-btn-0")).not.toBeDisabled();
    });

    test("enables add button when type with options has complete values", () => {
      const completeFieldWithValues = {
        ...defaultMetaField,
        name: "Field",
        type: "CheckBoxList",
        values: [{ name: "Option 1", value: "opt1" }]
      };

      renderWithFormik(defaultProps, {
        meta_fields: [completeFieldWithValues]
      });

      expect(screen.getByTestId("add-btn-0")).not.toBeDisabled();
    });
  });
});
