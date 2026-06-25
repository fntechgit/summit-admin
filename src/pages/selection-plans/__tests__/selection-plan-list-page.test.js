import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import SelectionPlanListPage from "../selection-plan-list-page";
import {
  getSelectionPlans,
  getSelectionPlan,
  deleteSelectionPlan,
  resetSelectionPlanForm,
  saveSelectionPlan,
  saveSelectionPlanSettings
} from "../../../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../../../actions/marketing-actions";

jest.mock("../../../actions/selection-plan-actions", () => ({
  getSelectionPlans: jest.fn(),
  getSelectionPlan: jest.fn(),
  deleteSelectionPlan: jest.fn(),
  resetSelectionPlanForm: jest.fn(),
  saveSelectionPlan: jest.fn(),
  saveSelectionPlanSettings: jest.fn()
}));

jest.mock("../../../actions/marketing-actions", () => ({
  getMarketingSettingsBySelectionPlan: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }) => (
    <div>
      <button type="button" onClick={() => onEdit({ id: 1, name: "CFP 2026" })}>
        edit-row
      </button>
      <button type="button" onClick={() => onDelete(1)}>
        delete-row
      </button>
    </div>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: () => <input placeholder="search-plans" />
  })
);

jest.mock("../edit-selection-plan-page", () => ({
  __esModule: true,
  default: ({ onSave }) => (
    <div data-testid="edit-selection-plan">
      <button type="button" onClick={() => onSave({ marketing_settings: {} })}>
        popup-save
      </button>
    </div>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockHistory = { replace: jest.fn() };
const mockMatch = { params: {} };

const initialState = {
  currentSummitState: {
    currentSummit: { id: 1 }
  },
  currentSelectionPlanListState: {
    selectionPlans: [
      { id: 1, name: "CFP 2026", is_enabled: "yes", is_hidden: "no" }
    ],
    totalSelectionPlans: 1,
    perPage: 10,
    currentPage: 1,
    term: "",
    order: "id",
    orderDir: 1
  },
  currentSelectionPlanState: {
    entity: { id: 0, name: "" },
    errors: {}
  }
};

describe("SelectionPlanListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSelectionPlans.mockReturnValue(() => Promise.resolve());
    getSelectionPlan.mockReturnValue(() => Promise.resolve());
    deleteSelectionPlan.mockReturnValue(() => Promise.resolve());
    resetSelectionPlanForm.mockReturnValue({
      type: "RESET_SELECTION_PLAN_FORM"
    });
    getMarketingSettingsBySelectionPlan.mockReturnValue(() =>
      Promise.resolve()
    );
    saveSelectionPlan.mockReturnValue(() => Promise.resolve({ id: 1 }));
    saveSelectionPlanSettings.mockReturnValue(() => Promise.resolve());
  });

  it("reloads the list after a successful save", async () => {
    renderWithRedux(
      <SelectionPlanListPage history={mockHistory} match={mockMatch} />,
      { initialState }
    );

    // Open dialog
    await userEvent.click(
      screen.getByRole("button", {
        name: "selection_plan_list.add_selection_plan"
      })
    );
    expect(screen.getByTestId("edit-selection-plan")).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "popup-save" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleSave → refreshSelectionPlans
    expect(getSelectionPlans).toHaveBeenCalledTimes(2);
  });

  it("reloads the list after a successful delete", async () => {
    renderWithRedux(
      <SelectionPlanListPage history={mockHistory} match={mockMatch} />,
      { initialState }
    );

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleDelete .then()
    expect(getSelectionPlans).toHaveBeenCalledTimes(2);
  });

  it("does not reload the list after a failed delete", async () => {
    deleteSelectionPlan.mockReturnValue(() =>
      Promise.reject(new Error("delete failed"))
    );

    renderWithRedux(
      <SelectionPlanListPage history={mockHistory} match={mockMatch} />,
      { initialState }
    );

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Only call 1: useEffect on mount — .then() does not fire on rejection
    expect(getSelectionPlans).toHaveBeenCalledTimes(1);
  });
});
