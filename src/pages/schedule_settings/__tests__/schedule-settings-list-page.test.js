import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import ScheduleSettingsListPage from "../schedule-settings-list-page";
import {
  getAllScheduleSettings,
  deleteScheduleSetting,
  seedDefaultScheduleSettings
} from "../../../actions/schedule-settings-actions";

jest.mock("../../../actions/schedule-settings-actions", () => ({
  getAllScheduleSettings: jest.fn(),
  deleteScheduleSetting: jest.fn(),
  seedDefaultScheduleSettings: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, onEdit, onDelete, onSort, canDelete }) => (
    <div>
      {data.map((row) => (
        <div key={row.id}>
          <span>{row.key}</span>
          <button type="button" onClick={() => onEdit(row)}>
            {`edit-${row.id}`}
          </button>
          {canDelete(row) && (
            <button type="button" onClick={() => onDelete(row.id)}>
              {`delete-${row.id}`}
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => onSort("key", -1)}>
        sort-col
      </button>
    </div>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockHistory = { push: jest.fn() };

const scheduleSettings = [
  { id: 1, key: "default-setting", is_default: true },
  { id: 2, key: "custom-setting", is_default: false }
];

const initialState = {
  currentSummitState: { currentSummit: createMockSummit() },
  scheduleSettingsListState: {
    scheduleSettings,
    order: "key",
    orderDir: 1,
    totalScheduleSettings: 2
  }
};

describe("ScheduleSettingsListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllScheduleSettings.mockReturnValue(() => Promise.resolve());
    deleteScheduleSetting.mockReturnValue(() => Promise.resolve());
    seedDefaultScheduleSettings.mockReturnValue(() => Promise.resolve());
  });

  it("loads schedule settings on mount using the persisted order", () => {
    renderWithRedux(<ScheduleSettingsListPage history={mockHistory} />, {
      initialState
    });

    expect(getAllScheduleSettings).toHaveBeenCalledWith("key", 1);
  });

  it("navigates to the edit route", async () => {
    renderWithRedux(<ScheduleSettingsListPage history={mockHistory} />, {
      initialState
    });

    await userEvent.click(screen.getByRole("button", { name: "edit-2" }));

    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/${createMockSummit().id}/schedule-settings/2`
    );
  });

  it("navigates to the add-setting route", async () => {
    renderWithRedux(<ScheduleSettingsListPage history={mockHistory} />, {
      initialState
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: "schedule_settings_list.add_schedule_settings"
      })
    );

    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/${createMockSummit().id}/schedule-settings/new`
    );
  });

  it("hides the delete action for the default schedule setting", () => {
    renderWithRedux(<ScheduleSettingsListPage history={mockHistory} />, {
      initialState
    });

    expect(
      screen.queryByRole("button", { name: "delete-1" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "delete-2" })
    ).toBeInTheDocument();
  });

  it("deletes a non-default schedule setting by id", async () => {
    renderWithRedux(<ScheduleSettingsListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-2" }));
      await flushPromises();
    });

    expect(deleteScheduleSetting).toHaveBeenCalledWith(2);
  });

  it("keeps sorting wired to getAllScheduleSettings", async () => {
    renderWithRedux(<ScheduleSettingsListPage history={mockHistory} />, {
      initialState
    });

    await userEvent.click(screen.getByRole("button", { name: "sort-col" }));

    expect(getAllScheduleSettings).toHaveBeenCalledWith("key", -1);
  });

  it("seeds default schedule settings", async () => {
    renderWithRedux(<ScheduleSettingsListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", {
          name: "schedule_settings_list.seed_defaults"
        })
      );
      await flushPromises();
    });

    expect(seedDefaultScheduleSettings).toHaveBeenCalled();
  });

  it("shows the empty state when there are no schedule settings", () => {
    renderWithRedux(<ScheduleSettingsListPage history={mockHistory} />, {
      initialState: {
        ...initialState,
        scheduleSettingsListState: {
          ...initialState.scheduleSettingsListState,
          scheduleSettings: [],
          totalScheduleSettings: 0
        }
      }
    });

    expect(
      screen.getByText("schedule_settings_list.no_schedule_settings")
    ).toBeInTheDocument();
  });
});
