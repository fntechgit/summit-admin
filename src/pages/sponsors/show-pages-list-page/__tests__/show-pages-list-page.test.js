import React from "react";
import userEvent from "@testing-library/user-event";
import { act, screen, waitFor } from "@testing-library/react";
import { GlobalConfirmDialog } from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import ShowPagesListPage from "../index";
import { renderWithRedux } from "../../../../utils/test-utils";
import { DEFAULT_STATE as showPagesListDefaultState } from "../../../../reducers/sponsors/show-pages-list-reducer";

import {
  getShowPages,
  getShowPage,
  deleteShowPage,
  archiveShowPage,
  unarchiveShowPage
} from "../../../../actions/show-pages-actions";
import { getSponsorships } from "../../../../actions/sponsor-forms-actions";

import {
  DEFAULT_CURRENT_PAGE,
  MAX_PER_PAGE
} from "../../../../utils/constants";

// Mocks

jest.mock(
  "../components/global-page/global-page-popup",
  () =>
    function MockGlobalPagePopup({ open, onClose }) {
      return open ? (
        <div data-testid="global-page-popup">
          <button onClick={onClose}>Close</button>
        </div>
      ) : null;
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

jest.mock("../../../../actions/show-pages-actions", () => ({
  ...jest.requireActual("../../../../actions/show-pages-actions"),
  getShowPages: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getShowPage: jest.fn(
    () => () => Promise.resolve({ id: 1, name: "Test Page" })
  ),
  saveShowPage: jest.fn(() => () => Promise.resolve()),
  deleteShowPage: jest.fn(() => () => Promise.resolve()),
  archiveShowPage: jest.fn(() => () => Promise.resolve()),
  unarchiveShowPage: jest.fn(() => () => Promise.resolve()),
  resetShowPageForm: jest.fn(() => ({ type: "MOCK_ACTION" }))
}));

jest.mock("../../../../actions/sponsor-forms-actions", () => ({
  getSponsorships: jest.fn(() => () => Promise.resolve({ items: [] }))
}));

// Helper to create show page data
const createShowPage = (id, overrides = {}) => ({
  id,
  code: `CODE-${id}`,
  name: `Page ${id}`,
  modules: [],
  is_archived: false,
  ...overrides
});

const renderWithConfirmDialog = (ui, options) => renderWithRedux(
    <>
      <GlobalConfirmDialog />
      {ui}
    </>,
    options
  );

describe("ShowPagesListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component", () => {
    it("should render empty state when no pages exist", () => {
      renderWithConfirmDialog(<ShowPagesListPage />, {
        initialState: {
          showPagesListState: {
            ...showPagesListDefaultState,
            showPages: [],
            totalCount: 0
          }
        }
      });

      expect(
        screen.getByText("show_pages.no_sponsors_pages")
      ).toBeInTheDocument();
    });

    it("should render table when pages exist", () => {
      renderWithConfirmDialog(<ShowPagesListPage />, {
        initialState: {
          showPagesListState: {
            ...showPagesListDefaultState,
            showPages: [createShowPage(1), createShowPage(2)],
            totalCount: 2
          }
        }
      });

      expect(screen.getByText("Page 1")).toBeInTheDocument();
      expect(screen.getByText("Page 2")).toBeInTheDocument();
    });

    it("should call getShowPage and open popup when edit is clicked", async () => {
      renderWithConfirmDialog(<ShowPagesListPage />, {
        initialState: {
          showPagesListState: {
            ...showPagesListDefaultState,
            showPages: [createShowPage(1)],
            totalCount: 1
          }
        }
      });
      const editButton = screen.getByTestId("EditIcon").closest("button");
      await act(async () => {
        await userEvent.click(editButton);
      });
      expect(getSponsorships).toHaveBeenCalledWith(
        DEFAULT_CURRENT_PAGE,
        MAX_PER_PAGE
      );
      expect(getShowPage).toHaveBeenCalledWith(1);
      await waitFor(() => {
        expect(screen.getByTestId("page-template-popup")).toBeInTheDocument();
      });
    });

    it("should refresh list after save", async () => {
      renderWithConfirmDialog(<ShowPagesListPage />, {
        initialState: {
          showPagesListState: {
            ...showPagesListDefaultState,
            showPages: [createShowPage(1)],
            totalCount: 1
          }
        }
      });
      const editButton = screen.getByTestId("EditIcon").closest("button");
      await act(async () => {
        await userEvent.click(editButton);
      });
      expect(getSponsorships).toHaveBeenCalledWith(
        DEFAULT_CURRENT_PAGE,
        MAX_PER_PAGE
      );
      await waitFor(() => {
        expect(screen.getByTestId("page-template-popup")).toBeInTheDocument();
      });
      const saveButton = screen.getByText("Save");
      await act(async () => {
        await userEvent.click(saveButton);
      });
      await waitFor(() => {
        expect(getShowPages).toHaveBeenCalledTimes(2); // mount and after save
      });
      expect(
        screen.queryByTestId("page-template-popup")
      ).not.toBeInTheDocument();
    });

    it("should call deleteShowPage and refresh list when delete is confirmed", async () => {
      renderWithConfirmDialog(<ShowPagesListPage />, {
        initialState: {
          showPagesListState: {
            ...showPagesListDefaultState,
            showPages: [
              createShowPage(1),
              createShowPage(2),
              createShowPage(3)
            ],
            totalCount: 3
          }
        }
      });
      const deleteButtons = screen.getAllByTestId("DeleteIcon");
      const secondDeleteButton = deleteButtons[1].closest("button");
      await act(async () => {
        await userEvent.click(secondDeleteButton);
      });
      expect(
        await screen.findByText("general.are_you_sure")
      ).toBeInTheDocument();
      await act(async () => {
        await userEvent.click(
          await screen.findByRole("button", {
            name: /general\.yes_delete|confirm/i
          })
        );
      });
      await waitFor(() => {
        expect(deleteShowPage).toHaveBeenCalledWith(2); // check id 2
      });
      await waitFor(() => {
        expect(getShowPages).toHaveBeenCalledTimes(2);
      });
    });

    it("should not call deleteShowPage when delete is cancelled", async () => {
      renderWithConfirmDialog(<ShowPagesListPage />, {
        initialState: {
          showPagesListState: {
            ...showPagesListDefaultState,
            showPages: [createShowPage(1)],
            totalCount: 1
          }
        }
      });
      const deleteButton = screen.getByTestId("DeleteIcon").closest("button");
      await act(async () => {
        await userEvent.click(deleteButton);
      });
      expect(
        await screen.findByText("general.are_you_sure")
      ).toBeInTheDocument();
      await act(async () => {
        await userEvent.click(
          await screen.findByRole("button", {
            name: /cancel|general\.cancel/i
          })
        );
      });
      expect(deleteShowPage).not.toHaveBeenCalled();
      expect(getShowPages).toHaveBeenCalledTimes(1);
    });

    it("should call archiveShowPage for non-archived item", async () => {
      renderWithConfirmDialog(<ShowPagesListPage />, {
        initialState: {
          showPagesListState: {
            ...showPagesListDefaultState,
            showPages: [createShowPage(1, { is_archived: false })],
            totalCount: 1
          }
        }
      });
      const archiveButton = screen.getByText("general.archive");
      await act(async () => {
        await userEvent.click(archiveButton);
      });
      expect(archiveShowPage).toHaveBeenCalledWith(1);
    });

    it("should call unarchiveShowPage for archived item", async () => {
      renderWithConfirmDialog(<ShowPagesListPage />, {
        initialState: {
          showPagesListState: {
            ...showPagesListDefaultState,
            showPages: [createShowPage(1, { is_archived: true })],
            totalCount: 1
          }
        }
      });
      const unarchiveButton = screen.getByText("general.unarchive");
      await act(async () => {
        await userEvent.click(unarchiveButton);
      });
      expect(unarchiveShowPage).toHaveBeenCalledWith(1);
    });
  });
});
