import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "utils/test-utils";
import { saveFormTemplate } from "actions/sponsor-forms-actions";
import FormTemplatePopup from "../form-template-popup";

jest.mock("actions/sponsor-forms-actions", () => ({
  saveFormTemplate: jest.fn(),
  updateFormTemplate: jest.fn(),
  resetFormTemplate: jest.fn(() => ({ type: "RESET_TEMPLATE_FORM" }))
}));

jest.mock("actions/summit-actions", () => ({
  getSummitSponsorshipTypes: jest.fn(() => ({
    type: "GET_SUMMIT_SPONSORSHIP_TYPES"
  }))
}));

jest.mock("../form-template-form", () => ({
  __esModule: true,
  default: ({ onSubmit, isSaving }) => (
    <button
      type="button"
      disabled={isSaving}
      onClick={() => onSubmit({ id: null, code: "111" })}
    >
      submit-form-template
    </button>
  )
}));

describe("FormTemplatePopup", () => {
  const initialState = {
    sponsorFormsListState: {
      sponsorships: { items: [] },
      formTemplate: {}
    },
    currentSummitState: {
      currentSummit: {
        time_zone_id: "UTC"
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps modal open when save fails", async () => {
    const onClose = jest.fn();
    saveFormTemplate.mockReturnValue(() => Promise.reject(new Error("dup")));

    renderWithRedux(<FormTemplatePopup open onClose={onClose} edit={false} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "submit-form-template" })
      );
      await Promise.resolve();
    });

    expect(saveFormTemplate).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("prevents duplicate save requests while saving", async () => {
    const onClose = jest.fn();
    let resolveSave;
    const pendingPromise = new Promise((resolve) => {
      resolveSave = resolve;
    });

    saveFormTemplate.mockReturnValue(() => pendingPromise);

    renderWithRedux(<FormTemplatePopup open onClose={onClose} edit={false} />, {
      initialState
    });

    const button = screen.getByRole("button", { name: "submit-form-template" });

    await act(async () => {
      await userEvent.click(button);
      await userEvent.click(button);
    });

    expect(saveFormTemplate).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave();
      await Promise.resolve();
    });
  });

  it("closes modal after successful save", async () => {
    const onClose = jest.fn();
    saveFormTemplate.mockReturnValue(() => Promise.resolve());

    renderWithRedux(<FormTemplatePopup open onClose={onClose} edit={false} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "submit-form-template" })
      );
      await Promise.resolve();
    });

    expect(saveFormTemplate).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
