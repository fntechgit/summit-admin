import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import BadgeFeatureListPage from "../badge-feature-list-page";
import {
  getBadgeFeatures,
  deleteBadgeFeature
} from "../../../actions/badge-actions";

jest.mock("../../../actions/badge-actions", () => ({
  getBadgeFeatures: jest.fn(),
  deleteBadgeFeature: jest.fn()
}));

let capturedTableProps;

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: (props) => {
    capturedTableProps = props;
    const { onEdit, onDelete, onSort } = props;
    return (
      <div>
        <button type="button" onClick={() => onEdit({ id: 1 })}>
          edit-row
        </button>
        <button type="button" onClick={() => onDelete(1)}>
          delete-row
        </button>
        <button type="button" onClick={() => onSort("name", -1)}>
          sort-col
        </button>
      </div>
    );
  }
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockHistory = { push: jest.fn() };

const initialState = {
  currentSummitState: { currentSummit: createMockSummit() },
  currentBadgeFeatureListState: {
    badgeFeatures: [{ id: 1, name: "VIP", description: "vip access" }],
    totalBadgeFeatures: 1,
    order: "name",
    orderDir: 1
  }
};

const renderPage = () =>
  renderWithRedux(<BadgeFeatureListPage history={mockHistory} />, {
    initialState
  });

const click = (name) =>
  act(async () => {
    await userEvent.click(screen.getByRole("button", { name }));
  });

describe("BadgeFeatureListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBadgeFeatures.mockReturnValue(() => Promise.resolve());
    deleteBadgeFeature.mockReturnValue(() => Promise.resolve());
  });

  it("fetches badge features on mount without enabling pagination", () => {
    renderPage();

    expect(getBadgeFeatures).toHaveBeenCalledWith();
    expect(capturedTableProps.onPageChange).toBeUndefined();
  });

  it("sorts through getBadgeFeatures(order, orderDir)", async () => {
    renderPage();
    await click("sort-col");

    expect(getBadgeFeatures).toHaveBeenLastCalledWith("name", -1);
  });

  it("navigates to the edit page", async () => {
    renderPage();
    await click("edit-row");

    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/456/badge-features/1"
    );
  });

  it("deletes the badge feature by id (confirm is handled inside MuiTable)", async () => {
    renderPage();
    await click("delete-row");

    expect(deleteBadgeFeature).toHaveBeenCalledWith(1);
  });

  it("navigates to the add page", async () => {
    renderPage();
    await click("badge_feature_list.add_badge_feature");

    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/456/badge-features/new"
    );
  });
});
