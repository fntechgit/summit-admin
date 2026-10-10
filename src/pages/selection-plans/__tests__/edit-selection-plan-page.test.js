import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import EditSelectionPlanPage from "../edit-selection-plan-page";
import {
  saveSelectionPlan,
  saveSelectionPlanSettings
} from "../../../actions/selection-plan-actions";

jest.mock("../../../actions/selection-plan-actions", () => ({
  saveSelectionPlan: jest.fn(),
  saveSelectionPlanSettings: jest.fn()
}));

jest.mock("../../../components/forms/selection-plan-form", () => ({
  __esModule: true,
  default: ({ entity, onSave }) => (
    <button
      type="button"
      onClick={() => onSave({ id: entity.id, marketing_settings: {} })}
    >
      form-save
    </button>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const buildState = (entity) => ({
  currentSummitState: { currentSummit: { id: 1 } },
  currentSelectionPlanState: { entity, errors: {} }
});

const clickSave = async () => {
  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: "form-save" }));
    await flushPromises();
  });
};

describe("EditSelectionPlanPage", () => {
  const history = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    saveSelectionPlanSettings.mockReturnValue(() => Promise.resolve());
  });

  it("navigates to the new selection plan after creating it", async () => {
    saveSelectionPlan.mockReturnValue(() => Promise.resolve({ id: 7 }));

    renderWithRedux(<EditSelectionPlanPage history={history} />, {
      initialState: buildState({ id: 0 })
    });
    await clickSave();

    expect(saveSelectionPlanSettings).toHaveBeenCalledWith({}, 7);
    expect(history.push).toHaveBeenCalledWith(
      "/app/summits/1/selection-plans/7"
    );
  });

  it("stays on the page after updating an existing selection plan", async () => {
    saveSelectionPlan.mockReturnValue(() => Promise.resolve({ id: 5 }));

    renderWithRedux(<EditSelectionPlanPage history={history} />, {
      initialState: buildState({ id: 5 })
    });
    await clickSave();

    expect(saveSelectionPlanSettings).toHaveBeenCalledWith({}, 5);
    expect(history.push).not.toHaveBeenCalled();
  });
});
