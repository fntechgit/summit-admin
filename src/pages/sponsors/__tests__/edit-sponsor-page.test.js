import React from "react";
import userEvent from "@testing-library/user-event";
import { act, screen } from "@testing-library/react";
import EditSponsorPage, {
  getFragmentFromValue,
  getTabFromUrlFragment
} from "../edit-sponsor-page";
import { renderWithRedux } from "../../../utils/test-utils";
import {
  DEFAULT_STATE as currentSponsorDefaultState
} from "../../../reducers/sponsors/sponsor-reducer";
import {
  DEFAULT_ENTITY as defaultSummitEntity,
  DEFAULT_STATE as currentSummitDefaultState
} from "../../../reducers/summits/current-summit-reducer";

global.window = { location: { pathname: "/sponsor-forms/items" } };
jest.mock(
  "../sponsor-forms-tab/components/manage-items/sponsor-forms-manage-items.js"
);
jest.mock("../sponsor-users-list-per-sponsor/index.js");

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

  describe("getTabFromUrlFragment", () => {
    it("returns correct values for defined fragments", () => {
      const newUrl1 = "#general";
      window.location.hash = newUrl1;

      const result1 = getTabFromUrlFragment();
      expect(result1).toBe(0);

      const newUrl2 = "#pages";
      window.location.hash = newUrl2;

      const result2 = getTabFromUrlFragment();
      expect(result2).toBe(2);

      const newUrl3 = "#media_uploads";
      window.location.hash = newUrl3;

      const result3 = getTabFromUrlFragment();
      expect(result3).toBe(3);

      const newUrl4 = "#badge_scans";
      window.location.hash = newUrl4;

      const result4 = getTabFromUrlFragment();
      expect(result4).toBe(7);
    });

    it("returns correct values for undefined fragments", () => {
      const newUrl1 = "#generalx";
      window.location.hash = newUrl1;

      const result1 = getTabFromUrlFragment();
      expect(result1).toBe(0);

      const newUrl2 = "#frewawqfwedwdwqq";
      window.location.hash = newUrl2;

      const result2 = getTabFromUrlFragment();
      expect(result2).toBe(0);

      const newUrl3 = "#";
      window.location.hash = newUrl3;

      const result3 = getTabFromUrlFragment();
      expect(result3).toBe(0);

      const newUrl4 = "";
      window.location.hash = newUrl4;

      const result4 = getTabFromUrlFragment();
      expect(result4).toBe(0);
    });
  });

  describe("Component", () => {
    const originalWindowLocation = window.location;
    it("should change the url fragment on tab click", async () => {
      delete window.location;

      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: {
          ...originalWindowLocation,
          hash: "#general"
        }
      });

      renderWithRedux(
        <EditSponsorPage
          history={{}}
          location={{
            pathname: "/sponsor-forms/items"
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

      const usersTabReference = screen.getByText("edit_sponsor.tab.forms");

      await act(async () => {
        await userEvent.click(usersTabReference);
      });

      expect(window.location.hash).toBe("forms");
    });

    it("should change the tab rendered on fragment change", async () => {
      delete window.location;

      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: {
          ...originalWindowLocation,
          hash: "#general"
        }
      });

      renderWithRedux(
        <EditSponsorPage
          history={{}}
          location={{
            pathname: "/sponsor-forms/items"
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

      delete window.location;

      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: {
          ...originalWindowLocation,
          hash: "#users"
        }
      });

      const usersTabPanel = screen.getByTestId("simple-tabpanel-1");
      expect(usersTabPanel).toBeDefined();
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalWindowLocation
      });
    });
  });
});
