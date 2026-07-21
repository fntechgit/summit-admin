import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "utils/test-utils";
import { saveSponsorCustomizedForm } from "actions/sponsor-forms-actions";
import CustomizedFormPopup from "../customized-form-popup";

jest.mock("actions/sponsor-forms-actions", () => ({
  saveSponsorCustomizedForm: jest.fn(),
  updateSponsorCustomizedForm: jest.fn(),
  getSponsorCustomizedForm: jest.fn(() => ({
    type: "GET_SPONSOR_CUSTOMIZED_FORM"
  })),
  resetSponsorCustomizedForm: jest.fn(() => ({
    type: "RESET_SPONSOR_CUSTOMIZED_FORM"
  }))
}));

jest.mock("../customized-form", () => ({
  __esModule: true,
  default: ({ onSubmit, isSaving, sponsor, summitId }) => {
    const sponsorshipIds = (sponsor?.sponsorships || []).map((s) => s.id);
    return (
      <>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onSubmit({ code: "111" })}
        >
          submit-customized-form
        </button>
        <span
          data-testid="addon-query-params"
          data-params={JSON.stringify([summitId, sponsor?.id, sponsorshipIds])}
        />
      </>
    );
  }
}));

describe("CustomizedFormPopup", () => {
  const initialState = {
    currentSummitState: {
      currentSummit: {
        time_zone_id: "UTC"
      }
    },
    sponsorCustomizedFormState: {
      entity: {}
    }
  };

  const createSponsor = (overrides = {}) => ({
    id: 1,
    sponsorships: [{ id: 42 }],
    ...overrides
  });

  const sponsor = createSponsor();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes sponsorship ids and summitId to the form as queryParams", () => {
    renderWithRedux(
      <CustomizedFormPopup
        formId={null}
        onClose={jest.fn()}
        sponsor={createSponsor({ sponsorships: [{ id: 42 }, { id: 99 }] })}
        summitId={69}
      />,
      { initialState }
    );

    const el = screen.getByTestId("addon-query-params");
    expect(JSON.parse(el.dataset.params)).toEqual([69, 1, [42, 99]]);
  });

  it("keeps modal open when save fails", async () => {
    const onClose = jest.fn();
    const onSaved = jest.fn();
    saveSponsorCustomizedForm.mockReturnValue(() =>
      Promise.reject(new Error("dup"))
    );

    renderWithRedux(
      <CustomizedFormPopup
        formId={null}
        onClose={onClose}
        onSaved={onSaved}
        sponsor={sponsor}
        summitId={69}
      />,
      { initialState }
    );

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "submit-customized-form" })
      );
      await Promise.resolve();
    });

    expect(saveSponsorCustomizedForm).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("prevents duplicate save requests while saving", async () => {
    const onClose = jest.fn();
    let resolveSave;
    const pendingPromise = new Promise((resolve) => {
      resolveSave = resolve;
    });

    saveSponsorCustomizedForm.mockReturnValue(() => pendingPromise);

    renderWithRedux(
      <CustomizedFormPopup
        formId={null}
        onClose={onClose}
        sponsor={sponsor}
        summitId={69}
      />,
      { initialState }
    );

    const button = screen.getByRole("button", {
      name: "submit-customized-form"
    });
    await act(async () => {
      await userEvent.click(button);
      await userEvent.click(button);
    });

    expect(saveSponsorCustomizedForm).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave();
      await Promise.resolve();
    });
  });
});
