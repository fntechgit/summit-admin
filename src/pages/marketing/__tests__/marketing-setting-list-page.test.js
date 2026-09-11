import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import MarketingSettingListPage from "../marketing-setting-list-page";
import {
  getMarketingSettings,
  deleteSetting,
  cloneMarketingSettings
} from "../../../actions/marketing-actions";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

jest.mock("../../../actions/marketing-actions", () => ({
  getMarketingSettings: jest.fn(),
  deleteSetting: jest.fn(),
  cloneMarketingSettings: jest.fn()
}));

jest.mock("../../../components/mui/showConfirmDialog", () => jest.fn());

jest.mock("../../../components/summit-dropdown", () => ({
  __esModule: true,
  default: ({ onClick }) => (
    <button type="button" onClick={() => onClick(999)}>
      clone-trigger
    </button>
  )
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete, onSort, onPageChange, onPerPageChange }) => (
    <div>
      <button type="button" onClick={() => onEdit({ id: 1, key: "test-key" })}>
        edit-row
      </button>
      <button
        type="button"
        onClick={() => onDelete({ id: 1, key: "test-key" })}
      >
        delete-row
      </button>
      <button type="button" onClick={() => onSort("key", -1)}>
        sort-col
      </button>
      <button type="button" onClick={() => onPageChange(2)}>
        page-2
      </button>
      <button type="button" onClick={() => onPerPageChange(50)}>
        perpage-50
      </button>
    </div>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ onSearch }) => (
      <button type="button" onClick={() => onSearch("newterm")}>
        search-trigger
      </button>
    )
  })
);

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockHistory = { push: jest.fn() };

const initialState = {
  currentSummitState: { currentSummit: createMockSummit() },
  marketingSettingListState: {
    settings: [
      {
        id: 1,
        key: "test-key",
        type: "TEXT",
        value: "test-value",
        selection_plan_id: "N/A"
      }
    ],
    totalSettings: 1,
    perPage: 10,
    currentPage: 1,
    term: "",
    order: "id",
    orderDir: 1,
    lastPage: 1
  }
};

describe("MarketingSettingListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMarketingSettings.mockReturnValue(() => Promise.resolve());
    deleteSetting.mockReturnValue(() => Promise.resolve());
    cloneMarketingSettings.mockReturnValue(() => Promise.resolve());
    showConfirmDialog.mockResolvedValue(true);
  });

  it("deletes the setting when the confirm dialog resolves true", async () => {
    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    expect(showConfirmDialog).toHaveBeenCalled();
    expect(deleteSetting).toHaveBeenCalledWith(1);
  });

  it("does not delete the setting when the confirm dialog resolves false", async () => {
    showConfirmDialog.mockResolvedValue(false);

    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    expect(deleteSetting).not.toHaveBeenCalled();
  });

  it("clones settings when the confirm dialog resolves true", async () => {
    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "clone-trigger" })
      );
      await flushPromises();
    });

    expect(cloneMarketingSettings).toHaveBeenCalledWith(999);
  });

  it("does not clone settings when the confirm dialog resolves false", async () => {
    showConfirmDialog.mockResolvedValue(false);

    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "clone-trigger" })
      );
      await flushPromises();
    });

    expect(cloneMarketingSettings).not.toHaveBeenCalled();
  });

  it("resets to the first page on search", async () => {
    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "search-trigger" })
      );
    });

    expect(getMarketingSettings).toHaveBeenLastCalledWith(
      "newterm",
      DEFAULT_CURRENT_PAGE,
      10,
      "id",
      1
    );
  });

  it("resets to the first page on per-page change", async () => {
    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "perpage-50" }));
    });

    expect(getMarketingSettings).toHaveBeenLastCalledWith(
      "",
      DEFAULT_CURRENT_PAGE,
      50,
      "id",
      1
    );
  });

  it("keeps the current page on sort", async () => {
    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "sort-col" }));
    });

    expect(getMarketingSettings).toHaveBeenLastCalledWith("", 1, 10, "key", -1);
  });

  it("navigates to the edit page", async () => {
    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
    });

    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/456/marketing/1"
    );
  });

  it("navigates to the add-setting page", async () => {
    renderWithRedux(<MarketingSettingListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "marketing.add_setting" })
      );
    });

    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/456/marketing/new"
    );
  });
});
