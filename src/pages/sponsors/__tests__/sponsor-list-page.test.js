import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SponsorListPage from "../sponsor-list-page";

import { renderWithRedux } from "../../../utils/test-utils";
import {
  getSponsors,
  importSponsorsCSV
} from "../../../actions/sponsor-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: {
    translate: (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key)
  }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input",
  () => ({
    __esModule: true,
    default: ({ handleUpload }) => (
      <button
        type="button"
        onClick={() => handleUpload(new File(["a"], "a.csv"))}
        data-testid="upload-a"
      >
        pick a
      </button>
    )
  })
);

jest.mock("../../../access-routes.yml", () => ({
  "sponsors-add": ["administrators"],
  "sponsors-delete": ["administrators"]
}));

jest.mock("../../../actions/sponsor-actions", () => ({
  ...jest.requireActual("../../../actions/sponsor-actions"),
  getSponsors: jest.fn(() => () => Promise.resolve()),
  importSponsorsCSV: jest.fn()
}));

const buildState = (groupCode) => ({
  loggedUserState: { member: { groups: [{ code: groupCode }] } },
  currentSummitState: { currentSummit: { id: 1 } },
  currentSponsorListState: {
    sponsors: [],
    totalSponsors: 0,
    perPage: 10,
    currentPage: 3,
    term: "acme",
    order: "order",
    orderDir: 1
  },
  currentSummitSponsorshipListState: { sponsorships: [] }
});

const report = (dryRun) => ({
  dry_run: dryRun,
  summary: {
    total: 1,
    sponsors_created: 1,
    companies_created: 1,
    skipped: 0,
    errors: 0,
    not_attempted: 0
  },
  rows: [
    {
      row: 1,
      company_input: "Acme",
      tier_input: "Gold",
      action: "create",
      company: { id: null, name: "Acme", match: "new" },
      tiers: ["Gold"],
      sponsor_id: null,
      duplicate_of_row: null,
      candidates: [],
      error: null
    }
  ]
});

const previewThenImportButton = async (user) => {
  await user.click(
    screen.getByRole("button", { name: "sponsor_list.import.button" })
  );
  await user.click(screen.getByTestId("upload-a"));
  await user.click(
    screen.getByRole("button", { name: "sponsor_list.import.preview" })
  );
  return screen.findByRole("button", { name: "sponsor_list.import.import" });
};

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

  describe("Import sponsors", () => {
    beforeEach(() => {
      getSponsors.mockClear();
      importSponsorsCSV.mockReset();
    });

    it("shows the Import button only to members who can add sponsors", () => {
      renderWithRedux(<SponsorListPage />, {
        initialState: buildState("administrators")
      });
      expect(
        screen.getByRole("button", { name: "sponsor_list.import.button" })
      ).toBeInTheDocument();
    });

    it("hides the Import button from members who cannot add sponsors", () => {
      renderWithRedux(<SponsorListPage />, {
        initialState: buildState("sponsors")
      });
      expect(
        screen.queryByRole("button", { name: "sponsor_list.import.button" })
      ).not.toBeInTheDocument();
    });

    it("refreshes the sponsor list at page 1 after a successful import", async () => {
      const user = userEvent.setup();
      importSponsorsCSV.mockImplementation(
        (file, dryRun) => () => Promise.resolve(report(dryRun))
      );
      renderWithRedux(<SponsorListPage />, {
        initialState: buildState("administrators")
      });
      const importBtn = await previewThenImportButton(user);
      expect(importSponsorsCSV).toHaveBeenCalledWith(expect.any(File), true);
      getSponsors.mockClear();

      await user.click(importBtn);

      await waitFor(() =>
        expect(importSponsorsCSV).toHaveBeenCalledWith(expect.any(File), false)
      );
      await waitFor(() =>
        expect(getSponsors).toHaveBeenCalledWith("acme", 1, 10, "order", 1)
      );
      await screen.findByRole("button", { name: "sponsor_list.import.close" });
    });

    it("keeps the preview and skips the refresh when the import rejects", async () => {
      const user = userEvent.setup();
      importSponsorsCSV.mockImplementation(
        (file, dryRun) => () =>
          dryRun ? Promise.resolve(report(true)) : Promise.reject(new Error())
      );
      renderWithRedux(<SponsorListPage />, {
        initialState: buildState("administrators")
      });
      const importBtn = await previewThenImportButton(user);
      getSponsors.mockClear();

      await user.click(importBtn);

      await waitFor(() =>
        expect(importSponsorsCSV).toHaveBeenCalledWith(expect.any(File), false)
      );
      await waitFor(() => expect(importBtn).toBeEnabled());
      expect(getSponsors).not.toHaveBeenCalled();
      expect(screen.getByRole("cell", { name: "Acme" })).toBeInTheDocument();
    });
  });
});
