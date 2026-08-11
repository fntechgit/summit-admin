import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "../../../../../../../utils/test-utils";
import ImportUsersPopup from "../import-users-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/summits-dropdown",
  () => ({
    __esModule: true,
    default: ({ onChange, excludeSummitIds }) => (
      <button
        data-testid="summit-select"
        type="button"
        onClick={() => onChange(2)}
      >
        {`Select Summit (excluding: ${excludeSummitIds})`}
      </button>
    )
  })
);

const mockCurrentSummit = { id: 1, name: "Current Summit" };

const baseState = {
  currentSummitState: { currentSummit: mockCurrentSummit },
  sponsorUsersListState: { userGroups: [] }
};

const renderPopup = (props = {}) =>
  renderWithRedux(
    <ImportUsersPopup
      sponsorId={42}
      companyId={99}
      onClose={jest.fn()}
      {...props}
    />,
    { initialState: baseState }
  );

describe("ImportUsersPopup (per-sponsor)", () => {
  it("mounts and shows the summit selector without throwing", () => {
    renderPopup();

    expect(
      screen.getByText("sponsor_users.import_users.title")
    ).toBeInTheDocument();
    expect(screen.getByTestId("summit-select")).toBeInTheDocument();
  });
});
