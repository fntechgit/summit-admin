import React from "react";
import userEvent from "@testing-library/user-event";
import { act, screen, waitFor } from "@testing-library/react";
import SponsorPagesTab from "../index";
import { renderWithRedux } from "../../../../utils/test-utils";
import { DEFAULT_STATE as sponsorPagesDefaultState } from "../../../../reducers/sponsors/sponsor-page-pages-list-reducer";
import { getSponsorCustomizedPage } from "../../../../actions/sponsor-pages-actions";

// Mocks

jest.mock(
  "../components/add-sponsor-page-template-popup",
  () =>
    function MockAddSponsorPageTemplatePopup({ onClose, onSubmit }) {
      return (
        <div data-testid="add-sponsor-page-template-popup">
          <button onClick={onClose}>Close</button>
          <button onClick={() => onSubmit({ id: 1, name: "Test" })}>
            Submit
          </button>
        </div>
      );
    }
);

jest.mock(
  "../../../sponsors-global/page-templates/page-template-popup",
  () =>
    function MockPageTemplatePopup({ onClose, onSave, pageTemplate }) {
      return (
        <div data-testid="page-template-popup">
          <span data-testid="popup-page-id">{pageTemplate?.id}</span>
          <button onClick={onClose}>Close</button>
          <button onClick={() => onSave({ id: 1, name: "Test" })}>Save</button>
        </div>
      );
    }
);

jest.mock("../../../../actions/sponsor-pages-actions", () => ({
  ...jest.requireActual("../../../../actions/sponsor-pages-actions"),
  getSponsorManagedPages: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getSponsorCustomizedPages: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getSponsorCustomizedPage: jest.fn(
    () => () => Promise.resolve({ id: 1, name: "Test Page" })
  ),
  saveSponsorCustomizedPage: jest.fn(() => () => Promise.resolve()),
  saveSponsorManagedPage: jest.fn(() => () => Promise.resolve()),
  resetSponsorPage: jest.fn(() => ({ type: "MOCK_ACTION" }))
}));

// Helpers

const createSponsor = (overrides = {}) => ({
  id: 1,
  sponsorships_collection: { sponsorships: [] },
  ...overrides
});

const createCustomizedPage = (id, overrides = {}) => ({
  id,
  code: `CODE-${id}`,
  name: `Page ${id}`,
  is_archived: false,
  ...overrides
});

const defaultState = {
  sponsorPagePagesListState: {
    ...sponsorPagesDefaultState,
    managedPages: {
      pages: [],
      totalItems: 0,
      currentPage: 1,
      perPage: 10,
      order: "id",
      orderDir: 1
    },
    customizedPages: {
      pages: [],
      totalItems: 0,
      currentPage: 1,
      perPage: 10,
      order: "id",
      orderDir: 1
    },
    hideArchived: false,
    term: ""
  }
};

describe("SponsorPagesTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component", () => {
    it("should open page popup when new page button is clicked", async () => {
      renderWithRedux(
        <SponsorPagesTab
          sponsor={createSponsor()}
          summitId={1}
          summitTZ="UTC"
        />,
        { initialState: defaultState }
      );

      const newPageButton = screen.getByText("edit_sponsor.pages_tab.new_page");
      await act(async () => {
        await userEvent.click(newPageButton);
      });

      expect(screen.getByTestId("page-template-popup")).toBeInTheDocument();
    });

    it("should close page popup and reset form when close is clicked", async () => {
      renderWithRedux(
        <SponsorPagesTab
          sponsor={createSponsor()}
          summitId={1}
          summitTZ="UTC"
        />,
        { initialState: defaultState }
      );

      const newPageButton = screen.getByText("edit_sponsor.pages_tab.new_page");
      await act(async () => {
        await userEvent.click(newPageButton);
      });

      expect(screen.getByTestId("page-template-popup")).toBeInTheDocument();

      const closeButton = screen.getByText("Close");
      await act(async () => {
        await userEvent.click(closeButton);
      });

      expect(
        screen.queryByTestId("page-template-popup")
      ).not.toBeInTheDocument();
    });

    it("should call getSponsorCustomizedPage and open popup when edit is clicked", async () => {
      renderWithRedux(
        <SponsorPagesTab
          sponsor={createSponsor()}
          summitId={1}
          summitTZ="UTC"
        />,
        {
          initialState: {
            sponsorPagePagesListState: {
              ...defaultState.sponsorPagePagesListState,
              customizedPages: {
                ...defaultState.sponsorPagePagesListState.customizedPages,
                pages: [createCustomizedPage(1)],
                totalItems: 1
              }
            }
          }
        }
      );

      const editButton = screen.getByTestId("EditIcon").closest("button");
      await act(async () => {
        await userEvent.click(editButton);
      });

      expect(getSponsorCustomizedPage).toHaveBeenCalledWith(1);
      await waitFor(() => {
        expect(screen.getByTestId("page-template-popup")).toBeInTheDocument();
      });
    });

    it("should refresh customized pages list after save", async () => {
      const {
        getSponsorCustomizedPages
      } = require("../../../../actions/sponsor-pages-actions");

      renderWithRedux(
        <SponsorPagesTab
          sponsor={createSponsor()}
          summitId={1}
          summitTZ="UTC"
        />,
        {
          initialState: {
            sponsorPagePagesListState: {
              ...defaultState.sponsorPagePagesListState,
              customizedPages: {
                ...defaultState.sponsorPagePagesListState.customizedPages,
                pages: [createCustomizedPage(1)],
                totalItems: 1
              }
            }
          }
        }
      );

      const editButton = screen.getByTestId("EditIcon").closest("button");
      await act(async () => {
        await userEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("page-template-popup")).toBeInTheDocument();
      });

      const saveButton = screen.getByText("Save");
      await act(async () => {
        await userEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(getSponsorCustomizedPages).toHaveBeenCalledTimes(2);
      });
      expect(
        screen.queryByTestId("page-template-popup")
      ).not.toBeInTheDocument();
    });
  });
});
