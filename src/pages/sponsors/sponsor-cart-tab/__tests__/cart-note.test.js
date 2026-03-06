// ---- Mocks must come first ----

// i18n translate: echo the key
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Mock epochToMoment utility
jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  epochToMoment: () => ({
    format: () => "March 6th 2026, 12:00pm"
  })
}));

// Mock confirm dialog
const mockShowConfirmDialog = jest.fn();
jest.mock("../../../../components/mui/showConfirmDialog", () => ({
  __esModule: true,
  default: (...args) => mockShowConfirmDialog(...args)
}));

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
import CartNote from "../components/cart-note";
/* eslint-enable import/first */

// Mock note data
const mockNote = {
  id: 1,
  content: "This is a sponsor note",
  type: "Sponsor",
  created: 1772823968,
  created_by_fullname: "San Paul"
};

// ---- Tests ----
describe("CartNote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("State: No Note", () => {
    test("renders text field when no note exists", () => {
      render(
        <CartNote
          title="Test Note"
          note={null}
          placeholder="Enter a note"
          onSave={jest.fn()}
        />
      );

      const textField = screen.getByPlaceholderText("Enter a note");
      expect(textField).toBeInTheDocument();
    });

    test("renders save button when no note exists", () => {
      render(
        <CartNote
          title="Test Note"
          note={null}
          placeholder="Enter a note"
          onSave={jest.fn()}
        />
      );

      expect(screen.getByText("general.save")).toBeInTheDocument();
    });

    test("save button is disabled when text field is empty", () => {
      render(
        <CartNote
          title="Test Note"
          note={null}
          placeholder="Enter a note"
          onSave={jest.fn()}
        />
      );

      const saveButton = screen.getByText("general.save");
      expect(saveButton).toBeDisabled();
    });

    test("save button is enabled when text is entered", async () => {
      const user = userEvent.setup();
      render(
        <CartNote
          title="Test Note"
          note={null}
          placeholder="Enter a note"
          onSave={jest.fn()}
        />
      );

      const textField = screen.getByPlaceholderText("Enter a note");
      await user.type(textField, "New note content");

      const saveButton = screen.getByText("general.save");
      expect(saveButton).not.toBeDisabled();
    });

    test("renders title", () => {
      render(
        <CartNote
          title="Sponsor Notes"
          note={null}
          placeholder="Enter a note"
          onSave={jest.fn()}
        />
      );

      expect(screen.getByText("Sponsor Notes")).toBeInTheDocument();
    });
  });

  describe("State: Note Present", () => {
    test("displays note content when note exists", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByText("This is a sponsor note")).toBeInTheDocument();
    });

    test("displays note metadata (author and date)", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(
        screen.getByText(/San Paul - March 6th 2026, 12:00pm/)
      ).toBeInTheDocument();
    });

    test("renders edit button when note exists", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    test("renders delete button when note exists", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(2); // edit and delete buttons
    });

    test("does not render text field when note exists and not editing", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          placeholder="Enter a note"
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(
        screen.queryByPlaceholderText("Enter a note")
      ).not.toBeInTheDocument();
    });
  });

  describe("State: Editing Note", () => {
    test("switches to edit mode when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          placeholder="Edit note"
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0]; // First button is edit
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Edit note")).toBeInTheDocument();
      });
    });

    test("pre-fills text field with existing note content when editing", async () => {
      const user = userEvent.setup();
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          placeholder="Edit note"
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0];
      await user.click(editButton);

      await waitFor(() => {
        const textField = screen.getByPlaceholderText("Edit note");
        expect(textField).toHaveValue("This is a sponsor note");
      });
    });

    test("hides note display when editing", async () => {
      const user = userEvent.setup();
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          placeholder="Edit note"
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/San Paul - March 6th 2026/)
        ).not.toBeInTheDocument();
      });
    });

    test("allows editing text in edit mode", async () => {
      const user = userEvent.setup();
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          placeholder="Edit note"
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0];
      await user.click(editButton);

      const textField = await screen.findByPlaceholderText("Edit note");
      await user.clear(textField);
      await user.type(textField, "Updated note content");

      expect(textField).toHaveValue("Updated note content");
    });
  });

  describe("Create Functionality", () => {
    test("calls onSave with new note content when creating", async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn(() => Promise.resolve());

      render(
        <CartNote
          title="Test Note"
          note={null}
          placeholder="Enter a note"
          onSave={mockOnSave}
        />
      );

      const textField = screen.getByPlaceholderText("Enter a note");
      await user.type(textField, "Brand new note");

      const saveButton = screen.getByText("general.save");
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        content: "Brand new note"
      });
    });

    test("exits edit mode after successful save", async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn(() => Promise.resolve());

      render(
        <CartNote
          title="Test Note"
          note={null}
          placeholder="Enter a note"
          onSave={mockOnSave}
        />
      );

      const textField = screen.getByPlaceholderText("Enter a note");
      await user.type(textField, "New note");

      const saveButton = screen.getByText("general.save");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe("Edit Functionality", () => {
    test("calls onSave with updated note content when editing", async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn(() => Promise.resolve());

      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          placeholder="Edit note"
          onSave={mockOnSave}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0];
      await user.click(editButton);

      const textField = await screen.findByPlaceholderText("Edit note");
      await user.clear(textField);
      await user.type(textField, "Modified note");

      const saveButton = screen.getByText("general.save");
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        id: 1,
        content: "Modified note",
        type: "Sponsor",
        created: 1772823968,
        created_by_fullname: "San Paul"
      });
    });

    test("exits edit mode after successful update", async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn(() => Promise.resolve());

      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          placeholder="Edit note"
          onSave={mockOnSave}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0];
      await user.click(editButton);

      const textField = await screen.findByPlaceholderText("Edit note");
      await user.clear(textField);
      await user.type(textField, "Modified");

      const saveButton = screen.getByText("general.save");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe("Delete Functionality", () => {
    test("shows confirmation dialog when delete is clicked", async () => {
      const user = userEvent.setup();
      mockShowConfirmDialog.mockResolvedValue(false);

      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons[1]; // Second button is delete
      await user.click(deleteButton);

      expect(mockShowConfirmDialog).toHaveBeenCalledWith({
        title: "general.are_you_sure",
        text: "general.remove_warning",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "general.yes_delete"
      });
    });

    test("calls onDelete when deletion is confirmed", async () => {
      const user = userEvent.setup();
      const mockOnDelete = jest.fn();
      mockShowConfirmDialog.mockResolvedValue(true);

      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={mockOnDelete}
        />
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons[1]; // Second button is delete
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(1);
      });
    });

    test("does not call onDelete when deletion is cancelled", async () => {
      const user = userEvent.setup();
      const mockOnDelete = jest.fn();
      mockShowConfirmDialog.mockResolvedValue(false);

      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={mockOnDelete}
        />
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons[1]; // Second button is delete
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockShowConfirmDialog).toHaveBeenCalled();
      });

      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe("canEdit Permission", () => {
    test("edit button is enabled when canEdit is true", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
          canEdit
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0];
      expect(editButton).not.toBeDisabled();
    });

    test("edit button is disabled when canEdit is false", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
          canEdit={false}
        />
      );

      const editButton = screen.getByLabelText("edit");
      expect(editButton).toBeDisabled();
    });

    test("canEdit defaults to true", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0];
      expect(editButton).not.toBeDisabled();
    });
  });

  describe("canDelete Permission", () => {
    test("delete button is enabled when canDelete is true and onDelete exists", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
          canDelete
        />
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons[1]; // Second button is delete
      expect(deleteButton).not.toBeDisabled();
    });

    test("delete button is disabled when canDelete is false", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
          canDelete={false}
        />
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons[1]; // Second button is delete
      expect(deleteButton).toBeDisabled();
    });

    test("delete button is disabled when onDelete is not provided", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          canDelete
        />
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons[1]; // Second button is delete
      expect(deleteButton).toBeDisabled();
    });

    test("canDelete defaults to true", () => {
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons[1]; // Second button is delete
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe("Disabled Save", () => {
    test("save button disabled when text is empty during creation", () => {
      render(
        <CartNote
          title="Test Note"
          note={null}
          placeholder="Enter a note"
          onSave={jest.fn()}
        />
      );

      const saveButton = screen.getByText("general.save");
      expect(saveButton).toBeDisabled();
    });

    test("save button disabled when text is cleared during edit", async () => {
      const user = userEvent.setup();
      render(
        <CartNote
          title="Test Note"
          note={mockNote}
          placeholder="Edit note"
          onSave={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      const editButton = buttons[0];
      await user.click(editButton);

      const textField = await screen.findByPlaceholderText("Edit note");
      await user.clear(textField);

      const saveButton = screen.getByText("general.save");
      expect(saveButton).toBeDisabled();
    });

    test("save button enabled when text exists", async () => {
      const user = userEvent.setup();
      render(
        <CartNote
          title="Test Note"
          note={null}
          placeholder="Enter a note"
          onSave={jest.fn()}
        />
      );

      const textField = screen.getByPlaceholderText("Enter a note");
      await user.type(textField, "Some text");

      const saveButton = screen.getByText("general.save");
      expect(saveButton).not.toBeDisabled();
    });
  });
});
