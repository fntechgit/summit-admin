import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../../../../utils/test-utils";
import AddSponsorExtraQuestionPopup from "../add-extra-question-popup";
import {
  deleteSponsorExtraQuestionValue,
  getSponsorExtraQuestionValueUsage
} from "../../../../../../actions/sponsor-actions";

// The real access-routes data: with the yml transform stub hasAccess() always returns true,
// which would show the X to everybody.
jest.mock("../../../../../../access-routes.yml", () => {
  const fs = require("fs");
  const path = require("path");
  const yaml = require("js-yaml");
  return yaml.load(
    fs.readFileSync(
      path.join(__dirname, "../../../../../../access-routes.yml"),
      "utf8"
    )
  );
});

jest.mock("../../../../../../actions/sponsor-actions", () => ({
  deleteSponsorExtraQuestionValue: jest.fn(),
  getSponsorExtraQuestionValueUsage: jest.fn(),
  updateSponsorExtraQuestionValueOrder: jest.fn(() => () => Promise.resolve())
}));

// the rich text editor and the drag and drop list are not what is under test
jest.mock("../../../../../../components/inputs/formik-text-editor", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../../../../../../components/mui/dnd-list", () => ({
  __esModule: true,
  default: ({ items, renderItem }) => (
    <div>
      {items.map((item, index) => (
        <div key={item.id ?? `new-${index}`}>
          {renderItem(item, index, {}, { isDragging: false })}
        </div>
      ))}
    </div>
  )
}));

const QUESTION = {
  id: 9,
  name: "TSHIRT_SIZE",
  label: "Size?",
  type: "ComboBox",
  values: [
    { id: 31, value: "L", label: "Large", is_default: false, order: 1 },
    // added in the form, not saved yet
    { value: "XL", label: "Extra large", is_default: false, order: 2 }
  ]
};

const USAGE = { answers_count: 0, reps_count: 0, reps: [] };

const renderPopup = (groupCode) =>
  renderWithRedux(
    <AddSponsorExtraQuestionPopup onClose={jest.fn()} onSubmit={jest.fn()} />,
    {
      initialState: {
        currentSponsorExtraQuestionState: {
          entity: QUESTION,
          allClasses: [{ type: "ComboBox", values: true }]
        },
        loggedUserState: { member: { groups: [{ code: groupCode }] } }
      }
    }
  );

const confirmDelete = async () => {
  await screen.findByTestId("delete-reason");
  await userEvent.click(screen.getByTestId("delete-check-devices"));
  await userEvent.click(screen.getByTestId("delete-check-pending"));
  await userEvent.click(screen.getByTestId("delete-check-third_party"));
  await userEvent.type(screen.getByTestId("delete-reason"), "typo in label");
  await userEvent.click(
    screen.getByRole("button", { name: "edit_sponsor.delete_question" })
  );
};

// hidden: the open delete dialog marks the form behind it aria-hidden
const optionShown = (value) =>
  screen
    .queryAllByRole("textbox", { hidden: true })
    .some((input) => input.value === value);

describe("AddSponsorExtraQuestionPopup option delete", () => {
  beforeEach(() => {
    getSponsorExtraQuestionValueUsage.mockImplementation(
      () => () => Promise.resolve(USAGE)
    );
  });

  afterEach(() => jest.clearAllMocks());

  it("doesn't let a sponsor delete a saved option, only drop an unsaved one", () => {
    renderPopup("sponsors");

    expect(screen.queryByTestId("remove-value-0")).not.toBeInTheDocument();
    expect(screen.getByTestId("remove-value-1")).toBeInTheDocument();
  });

  it("drops an unsaved option without calling the server", async () => {
    renderPopup("sponsors");

    await userEvent.click(screen.getByTestId("remove-value-1"));

    expect(optionShown("XL")).toBe(false);
    expect(deleteSponsorExtraQuestionValue).not.toHaveBeenCalled();
  });

  it("asks an admin for the reason and removes the option once it is deleted", async () => {
    deleteSponsorExtraQuestionValue.mockImplementation(
      () => () => Promise.resolve()
    );
    renderPopup("administrators");

    await userEvent.click(screen.getByTestId("remove-value-0"));

    expect(getSponsorExtraQuestionValueUsage).toHaveBeenCalledWith(9, 31);
    expect(
      screen.getByText("edit_sponsor.delete_value_title")
    ).toBeInTheDocument();
    // nothing is deleted until the dialog is confirmed
    expect(deleteSponsorExtraQuestionValue).not.toHaveBeenCalled();
    expect(optionShown("L")).toBe(true);

    await confirmDelete();

    expect(deleteSponsorExtraQuestionValue).toHaveBeenCalledWith(9, 31, {
      reason: "typo in label",
      deleteAnswers: false
    });
    await waitFor(() => expect(optionShown("L")).toBe(false));
    expect(optionShown("XL")).toBe(true);
  });

  it("keeps the option when the delete fails", async () => {
    deleteSponsorExtraQuestionValue.mockImplementation(
      () => () => Promise.reject(new Error("412"))
    );
    renderPopup("administrators");

    await userEvent.click(screen.getByTestId("remove-value-0"));
    await confirmDelete();

    await waitFor(() =>
      expect(deleteSponsorExtraQuestionValue).toHaveBeenCalled()
    );
    // the delete dialog stays open to retry or cancel, the option stays in the form
    expect(
      screen.getByText("edit_sponsor.delete_value_title")
    ).toBeInTheDocument();
    expect(optionShown("L")).toBe(true);
  });
});
