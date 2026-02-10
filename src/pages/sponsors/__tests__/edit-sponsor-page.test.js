import React from "react";
import userEvent from "@testing-library/user-event";
import { act, screen } from "@testing-library/react";
import EditSponsorPage, {
  getFragmentFromValue,
  getTabFromFragment
} from "../edit-sponsor-page";
import { renderWithRedux } from "../../../utils/test-utils";
import { DEFAULT_STATE as currentSponsorDefaultState } from "../../../reducers/sponsors/sponsor-reducer";
import { DEFAULT_STATE as currentSponsorFormsDefaultState } from "../../../reducers/sponsors/sponsor-page-forms-list-reducer";
import {
  DEFAULT_ENTITY as defaultSummitEntity,
  DEFAULT_STATE as currentSummitDefaultState
} from "../../../reducers/summits/current-summit-reducer";

jest.mock(
  "../sponsor-forms-tab/components/manage-items/sponsor-forms-manage-items.js"
);
jest.mock("../sponsor-users-list-per-sponsor/index.js");

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

describe("EditSponsorPage", () => {
  describe("getFragmentFromValue", () => {
    it("returns correct values", () => {
      const result1 = getFragmentFromValue(0);
      expect(result1).toBe("general");

      const result2 = getFragmentFromValue(2);
      expect(result2).toBe("pages");

      const result3 = getFragmentFromValue(3);
      expect(result3).toBe("media_uploads");

      const result4 = getFragmentFromValue(7);
      expect(result4).toBe("badge_scans");
    });
  });

  describe("getTabFromFragment", () => {
    it("returns correct values for defined fragments", () => {
      expect(getTabFromFragment({ hash: "#general" })).toBe(0);
      expect(getTabFromFragment({ hash: "#users" })).toBe(1);
      expect(getTabFromFragment({ hash: "#pages" })).toBe(2);
      expect(getTabFromFragment({ hash: "#media_uploads" })).toBe(3);
      expect(getTabFromFragment({ hash: "#forms" })).toBe(4);
      expect(getTabFromFragment({ hash: "#badge_scans" })).toBe(7);
    });
  });

  describe("Component", () => {
    it("should change the url fragment on tab click (same path)", async () => {
      const mockHistory = { push: jest.fn(), replace: jest.fn() };

      renderWithRedux(
        <EditSponsorPage
          history={mockHistory}
          location={{
            pathname: "/app/summits/12/sponsors/123"
          }}
          match={{}}
        />,
        {
          initialState: {
            currentSummitState: {
              ...currentSummitDefaultState,
              currentSummit: { ...defaultSummitEntity, id: 12 }
            },
            loggedUserState: {
              member: {
                groups: {}
              }
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
            sponsorPageFormsListState: {
              ...currentSponsorFormsDefaultState
            }
          }
        }
      );

      const usersTabReference = screen.getByText("edit_sponsor.tab.forms");

      await act(async () => {
        await userEvent.click(usersTabReference);
      });

      expect(mockHistory.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: "#forms"
        })
      );
      expect(mockHistory.push).not.toHaveBeenCalled();
    });

    it("should call history.push on tab click when on nested route", async () => {
      const mockHistory = { push: jest.fn(), replace: jest.fn() };

      renderWithRedux(
        <EditSponsorPage
          history={mockHistory}
          location={{
            pathname: "/app/summits/12/sponsors/44/sponsor-forms/15/items"
          }}
          match={{ params: { form_id: 15 } }}
        />,
        {
          initialState: {
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
              entity: { ...currentSponsorDefaultState.entity, id: 44 }
            }
          }
        }
      );

      const usersTab = screen.getByText("edit_sponsor.tab.users");

      await act(async () => {
        await userEvent.click(usersTab);
      });

      expect(mockHistory.push).toHaveBeenCalledWith(
        "/app/summits/12/sponsors/44#users"
      );
    });

    it("should change the tab rendered on fragment change", () => {
      const { rerender } = renderWithRedux(
        <EditSponsorPage
          history={{}}
          location={{
            pathname: "/sponsor-forms/items",
            hash: "#general"
          }}
          match={{}}
        />,
        {
          initialState: {
            currentSummitState: {
              currentSummit: defaultSummitEntity,
              ...currentSummitDefaultState
            },
            loggedUserState: {
              member: {
                groups: {}
              }
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
              sponsorships: [],
              ...currentSponsorDefaultState
            }
          }
        }
      );

      const generalTabPanel = screen.getByTestId("simple-tabpanel-0");
      expect(generalTabPanel).toBeDefined();

      rerender(
        <EditSponsorPage
          history={{ replace: jest.fn() }}
          location={{ pathname: "/x", hash: "#users" }}
          match={{}}
        />
      );

      const usersTabPanel = screen.getByTestId("simple-tabpanel-1");
      expect(usersTabPanel).toBeDefined();
    });
  });
});
