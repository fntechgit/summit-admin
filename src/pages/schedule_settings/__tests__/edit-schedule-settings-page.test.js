import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import EditScheduleSettingsPage from "../edit-schedule-settings-page";
import {
  getScheduleSetting,
  resetScheduleSettingsForm,
  saveScheduleSettings
} from "../../../actions/schedule-settings-actions";

jest.mock("../../../actions/schedule-settings-actions", () => ({
  getScheduleSetting: jest.fn(),
  resetScheduleSettingsForm: jest.fn(),
  saveScheduleSettings: jest.fn()
}));

// the form is stubbed, this suite covers what the page passes into it
jest.mock("../../../components/forms/schedule-settings-form", () => (props) => (
  <div>
    <span data-testid="form-key">{props.entity.key}</span>
    <button type="button" onClick={() => props.onSubmit(props.entity)}>
      submit
    </button>
  </div>
));

jest.mock("react-breadcrumbs", () => ({ Breadcrumb: () => null }));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockHistory = { push: jest.fn() };

const buildState = (entity) => ({
  currentSummitState: { currentSummit: createMockSummit() },
  scheduleSettingsState: { entity, errors: {} },
  scheduleSettingsListState: {
    scheduleSettings: [
      { id: 1, key: "schedule_2" },
      { id: 2, key: "other" }
    ]
  }
});

const renderPage = (entity, params = {}) =>
  renderWithRedux(
    <EditScheduleSettingsPage
      match={{ params, url: "/schedule-settings" }}
      history={mockHistory}
    />,
    { initialState: buildState(entity) }
  );

describe("EditScheduleSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getScheduleSetting.mockReturnValue(() => Promise.resolve());
    resetScheduleSettingsForm.mockReturnValue(() => Promise.resolve());
    saveScheduleSettings.mockReturnValue(() => Promise.resolve());
  });

  it("resets the form when there is no id in the route", () => {
    renderPage({ id: 0, key: "" });
    expect(resetScheduleSettingsForm).toHaveBeenCalled();
    expect(getScheduleSetting).not.toHaveBeenCalled();
  });

  it("loads the schedule setting when there is an id in the route", () => {
    renderPage({ id: 5, key: "my_key" }, { schedule_settings_id: "5" });
    expect(getScheduleSetting).toHaveBeenCalledWith("5");
  });

  it("generates a free key for a new entity without mutating redux state", () => {
    const entity = { id: 0, key: "" };
    renderPage(entity);
    expect(screen.getByTestId("form-key")).toHaveTextContent("schedule_3");
    expect(entity.key).toBe("");
  });

  it("keeps the existing key for a saved entity", () => {
    renderPage({ id: 5, key: "my_key" }, { schedule_settings_id: "5" });
    expect(screen.getByTestId("form-key")).toHaveTextContent("my_key");
  });

  it("hides add new on a new entity", () => {
    renderPage({ id: 0, key: "" });
    expect(screen.queryByText("general.add_new")).not.toBeInTheDocument();
  });

  it("navigates to the new page from add new", async () => {
    renderPage({ id: 5, key: "my_key" }, { schedule_settings_id: "5" });
    await userEvent.click(screen.getByText("general.add_new"));
    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/456/schedule-settings/new"
    );
  });

  it("forwards submit to saveScheduleSettings", async () => {
    renderPage({ id: 5, key: "my_key" }, { schedule_settings_id: "5" });
    await userEvent.click(screen.getByText("submit"));
    expect(saveScheduleSettings).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, key: "my_key" })
    );
  });
});
