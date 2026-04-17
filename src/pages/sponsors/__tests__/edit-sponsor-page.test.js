import React from "react";
import userEvent from "@testing-library/user-event";
import { act, screen } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import SponsorPage from "../sponsor-page";
import { renderWithRedux } from "../../../utils/test-utils";
import { DEFAULT_STATE as currentSponsorDefaultState } from "../../../reducers/sponsors/sponsor-reducer";
import { DEFAULT_STATE as sponsorPageFormsListDefaultState } from "../../../reducers/sponsors/sponsor-page-forms-list-reducer";
import {
  DEFAULT_ENTITY as defaultSummitEntity,
  DEFAULT_STATE as currentSummitDefaultState
} from "../../../reducers/summits/current-summit-reducer";

jest.mock(
  "../sponsor-page/tabs/sponsor-forms-tab/components/manage-items/sponsor-forms-manage-items.js"
);
jest.mock("../sponsor-page/tabs/sponsor-users-list-per-sponsor/index.js");

jest.mock("../../../actions/sponsor-actions", () => ({
  ...jest.requireActual("../../../actions/sponsor-actions"),
  getSponsorAdvertisements: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getSponsorMaterials: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getSponsorSocialNetworks: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getSponsorLeadReportSettingsMeta: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getSponsorTiers: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getExtraQuestionMeta: jest.fn(() => ({ type: "MOCK_ACTION" })),
  resetSponsorForm: jest.fn(() => ({ type: "MOCK_ACTION" }))
}));

const SPONSOR_ROUTE = "/app/summits/:summit_id/sponsors/:sponsor_id";

const baseState = {
  currentSummitState: {
    ...currentSummitDefaultState,
    currentSummit: { ...defaultSummitEntity, id: 12 }
  },
  loggedUserState: {
    member: { groups: {} }
  },
  currentSummitSponsorshipListState: {
    sponsorships: [],
    currentPage: 1,
    lastPage: 1,
    perPage: 100,
    order: "order",
    orderDir: 1,
    totalSponsorships: 0
  },
  currentSponsorState: {
    ...currentSponsorDefaultState,
    entity: { ...currentSponsorDefaultState.entity, id: 123 }
  },
  sponsorPageFormsListState: sponsorPageFormsListDefaultState
};

const renderSponsorPage = (url, state = baseState) => {
  const history = createMemoryHistory({ initialEntries: [url] });
  return {
    history,
    ...renderWithRedux(
      <Router history={history}>
        <Route path={SPONSOR_ROUTE} component={SponsorPage} />
      </Router>,
      { initialState: state }
    )
  };
};

describe("SponsorPage", () => {
  describe("Component", () => {
    it("renders the tab nav at the base sponsor URL", () => {
      renderSponsorPage("/app/summits/12/sponsors/123");

      expect(screen.getByText("edit_sponsor.tab.general")).toBeInTheDocument();
      expect(screen.getByText("edit_sponsor.tab.forms")).toBeInTheDocument();
    });

    it("navigates to the correct URL when a tab is clicked", async () => {
      const { history } = renderSponsorPage("/app/summits/12/sponsors/123");

      const formsTab = screen.getByText("edit_sponsor.tab.forms");

      await act(async () => {
        await userEvent.click(formsTab);
      });

      expect(history.location.pathname).toBe(
        "/app/summits/12/sponsors/123/forms"
      );
    });

    it("selects the correct tab based on URL path", () => {
      renderSponsorPage("/app/summits/12/sponsors/123/users");

      const usersTab = screen.getByText("edit_sponsor.tab.users");
      expect(usersTab.closest("[aria-selected='true']")).toBeTruthy();
    });
  });
});
