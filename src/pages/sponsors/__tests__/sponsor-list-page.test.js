import React from "react";
import { screen } from "@testing-library/react";
import SponsorListPage from "../sponsor-list-page";

import { renderWithRedux } from "../../../utils/test-utils";
import { getSponsors } from "../../../actions/sponsor-actions";

jest.mock("../../../actions/sponsor-actions", () => ({
  ...jest.requireActual("../../../actions/sponsor-actions"),
  getSponsors: jest.fn(() => ({ type: "MOCK_ACTION" }))
}));

describe("SponsorListPage", () => {
  describe("Component", () => {
    it("should preserve and apply the search term when navigating back to the list", () => {
      const initialState = {
        loggedUserState: {
          member: { canAddSponsors: () => true, canDeleteSponsors: () => true }
        },
        currentSummitState: { currentSummit: { id: 1 } },
        currentSponsorListState: {
          sponsors: [
            {
              id: 1,
              company_name: "FNTECH",
              sponsorships: [],
              documents: [],
              forms: [],
              purchases: [],
              pages: [],
              order: 1
            }
          ],
          totalSponsors: 1,
          perPage: 10,
          currentPage: 1,
          term: "FNTECH",
          order: "order",
          orderDir: 1
        },
        currentSummitSponsorshipListState: { sponsorships: [] }
      };

      renderWithRedux(<SponsorListPage />, { initialState });

      // The input should have the search term value
      const input = screen.getByPlaceholderText(/search_inventory_items/i);
      expect(input.value).toBe("FNTECH");
      // Only FNTECH should be visible in the list
      expect(screen.getByText("FNTECH")).toBeInTheDocument();
      expect(screen.queryByText("OTHER")).not.toBeInTheDocument();

      // Should call getSponsors with the preserved term and params, including currentPage from state
      expect(getSponsors).toHaveBeenCalledWith(
        "FNTECH",
        initialState.currentSponsorListState.currentPage, // currentPage from state
        10, // perPage
        "order",
        1
      );
    });
  });
});
