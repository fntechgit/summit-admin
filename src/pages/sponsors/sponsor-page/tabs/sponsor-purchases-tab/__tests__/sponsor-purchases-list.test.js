/**
 * Copyright 2024 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

// ---- Mocks (must come before imports) ----

// ---- Imports ----

import React from "react";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../../../../utils/test-utils";
import SponsorPurchasesTab from "../index";
import {
  getSponsorPurchases,
  approveSponsorPurchase,
  rejectSponsorPurchase
} from "../../../../../../actions/sponsor-purchases-actions";
import {
  PURCHASE_METHODS,
  PURCHASE_STATUS
} from "../../../../../../utils/constants";

jest.mock("../../../../../../actions/sponsor-purchases-actions", () => ({
  ...jest.requireActual("../../../../../../actions/sponsor-purchases-actions"),
  getSponsorPurchases: jest.fn(() => () => Promise.resolve()),
  approveSponsorPurchase: jest.fn(() => () => Promise.resolve()),
  rejectSponsorPurchase: jest.fn(() => () => Promise.resolve())
}));

/**
 * SearchInput mock: plain <input> that fires onSearch on Enter key,
 * matching the real component behaviour without TextField overhead.
 */
jest.mock("../../../../../../components/mui/search-input", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onSearch, term }) => {
      const handleKeyDown = (e) => {
        if (e.key === "Enter") onSearch(e.target.value);
      };
      return (
        <input
          data-testid="search-input"
          defaultValue={term || ""}
          onKeyDown={handleKeyDown}
        />
      );
    }
  };
});

// ---- Helpers ----

const DEFAULT_PURCHASE_LIST_STATE = {
  purchases: [],
  order: "order",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  term: ""
};

const createInitialState = (overrides = {}) => ({
  sponsorPagePurchaseListState: {
    ...DEFAULT_PURCHASE_LIST_STATE,
    ...overrides
  }
});

const createPurchase = (overrides = {}) => ({
  id: 1,
  payment_id: 101,
  number: "ORD-001",
  purchased: "2024/01/01 10:00 am",
  payment_method: PURCHASE_METHODS.INVOICE,
  status: PURCHASE_STATUS.PENDING,
  amount: "$100.00",
  ...overrides
});

/**
 * Returns a within()-scoped helper targeting the table body rows.
 * TablePagination also renders a combobox (rows-per-page Select) outside
 * the <tbody>, so scoping to tbody isolates status-column assertions from
 * pagination controls.
 */
const withinTableBody = () => {
  // getAllByRole('rowgroup') returns [<thead>, <tbody>]
  const [, tbody] = screen.getAllByRole("rowgroup");
  return within(tbody);
};

// ---- Tests ----

describe("SponsorPurchasesTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Dropdown visibility logic
  // -----------------------------------------------------------------------

  describe("Dropdown visibility logic", () => {
    it("renders a status Select inside the row for INVOICE + PENDING purchase", () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [
            createPurchase({
              payment_method: PURCHASE_METHODS.INVOICE,
              status: PURCHASE_STATUS.PENDING
            })
          ],
          totalCount: 1
        })
      });

      expect(withinTableBody().getByRole("combobox")).toBeInTheDocument();
    });

    it("renders plain text for CARD + PENDING purchase — no dropdown in the row", () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [
            createPurchase({
              payment_method: PURCHASE_METHODS.CARD,
              status: PURCHASE_STATUS.PENDING
            })
          ],
          totalCount: 1
        })
      });

      expect(withinTableBody().queryByRole("combobox")).not.toBeInTheDocument();
      expect(
        withinTableBody().getByText(PURCHASE_STATUS.PENDING)
      ).toBeInTheDocument();
    });

    it("renders plain text for INVOICE + PAID purchase — no dropdown in the row", () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [
            createPurchase({
              payment_method: PURCHASE_METHODS.INVOICE,
              status: PURCHASE_STATUS.PAID
            })
          ],
          totalCount: 1
        })
      });

      expect(withinTableBody().queryByRole("combobox")).not.toBeInTheDocument();
      expect(
        withinTableBody().getByText(PURCHASE_STATUS.PAID)
      ).toBeInTheDocument();
    });

    it("renders plain text for INVOICE + CANCELLED purchase — no dropdown in the row", () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [
            createPurchase({
              payment_method: PURCHASE_METHODS.INVOICE,
              status: PURCHASE_STATUS.CANCELLED
            })
          ],
          totalCount: 1
        })
      });

      expect(withinTableBody().queryByRole("combobox")).not.toBeInTheDocument();
      expect(
        withinTableBody().getByText(PURCHASE_STATUS.CANCELLED)
      ).toBeInTheDocument();
    });

    it("dropdown lists all available status options when opened", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [createPurchase()],
          totalCount: 1
        })
      });

      await act(async () => {
        await userEvent.click(withinTableBody().getByRole("combobox"));
      });

      expect(
        screen.getByRole("option", { name: PURCHASE_STATUS.PENDING })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: PURCHASE_STATUS.PAID })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: PURCHASE_STATUS.CANCELLED })
      ).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Correct API call per selection
  // -----------------------------------------------------------------------

  describe("Correct API call per selection", () => {
    it("calls approveSponsorPurchase with paymentId when PAID is selected", async () => {
      const purchase = createPurchase();

      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [purchase],
          totalCount: 1
        })
      });

      await act(async () => {
        await userEvent.click(withinTableBody().getByRole("combobox"));
      });
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: PURCHASE_STATUS.PAID })
        );
      });

      expect(approveSponsorPurchase).toHaveBeenCalledWith(purchase.payment_id);
      expect(rejectSponsorPurchase).not.toHaveBeenCalled();
    });

    it("calls rejectSponsorPurchase with paymentId when CANCELLED is selected", async () => {
      const purchase = createPurchase();

      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [purchase],
          totalCount: 1
        })
      });

      await act(async () => {
        await userEvent.click(withinTableBody().getByRole("combobox"));
      });
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: PURCHASE_STATUS.CANCELLED })
        );
      });

      expect(rejectSponsorPurchase).toHaveBeenCalledWith(purchase.payment_id);
      expect(approveSponsorPurchase).not.toHaveBeenCalled();
    });

    it("calls no action when PENDING is re-selected (already pending)", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [createPurchase()],
          totalCount: 1
        })
      });

      await act(async () => {
        await userEvent.click(withinTableBody().getByRole("combobox"));
      });
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: PURCHASE_STATUS.PENDING })
        );
      });

      expect(approveSponsorPurchase).not.toHaveBeenCalled();
      expect(rejectSponsorPurchase).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe("Error handling", () => {
    it("keeps the component functional when approveSponsorPurchase rejects", async () => {
      // The real thunk swallows rejections via .catch(console.log); mirror that
      // so the component (not the test runner) is what handles the failure.
      approveSponsorPurchase.mockImplementationOnce(
        () => () => Promise.reject(new Error("Network error")).catch(() => {})
      );

      const purchase = createPurchase();

      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [purchase],
          totalCount: 1
        })
      });

      await act(async () => {
        await userEvent.click(withinTableBody().getByRole("combobox"));
      });
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: PURCHASE_STATUS.PAID })
        );
      });

      expect(approveSponsorPurchase).toHaveBeenCalledWith(purchase.payment_id);
      // Dropdown is still present — component did not unmount on error
      expect(withinTableBody().getByRole("combobox")).toBeInTheDocument();
    });

    it("keeps the component functional when rejectSponsorPurchase rejects", async () => {
      // The real thunk swallows rejections via .catch(console.log); mirror that
      // so the component (not the test runner) is what handles the failure.
      rejectSponsorPurchase.mockImplementationOnce(
        () => () => Promise.reject(new Error("Network error")).catch(() => {})
      );

      const purchase = createPurchase();

      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [purchase],
          totalCount: 1
        })
      });

      await act(async () => {
        await userEvent.click(withinTableBody().getByRole("combobox"));
      });
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: PURCHASE_STATUS.CANCELLED })
        );
      });

      expect(rejectSponsorPurchase).toHaveBeenCalledWith(purchase.payment_id);
      expect(withinTableBody().getByRole("combobox")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Grid refresh behavior
  // -----------------------------------------------------------------------

  describe("Grid refresh behavior", () => {
    it("calls getSponsorPurchases once on initial mount", () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState()
      });

      expect(getSponsorPurchases).toHaveBeenCalledTimes(1);
    });

    it("calls getSponsorPurchases with the search term when search is submitted", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState()
      });

      await act(async () => {
        await userEvent.type(screen.getByTestId("search-input"), "john{Enter}");
      });

      expect(getSponsorPurchases).toHaveBeenCalledWith("john");
    });

    it("calls getSponsorPurchases with the next page number when next-page is clicked", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({ currentPage: 1, totalCount: 25 })
      });

      // MUI TablePagination renders an "Go to next page" / "next page" button
      await act(async () => {
        await userEvent.click(
          screen.getByRole("button", { name: /next page/i })
        );
      });

      expect(getSponsorPurchases).toHaveBeenCalledWith(
        expect.anything(), // term
        2, // page 1 + 1
        expect.anything(), // perPage
        expect.anything(), // order
        expect.anything() // orderDir
      );
    });

    it("calls getSponsorPurchases with new perPage and resets to page 1", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        // No purchases → no status combobox; the only combobox is rows-per-page
        initialState: createInitialState({ currentPage: 3, totalCount: 0 })
      });

      // MUI TablePagination labels the rows-per-page Select with labelRowsPerPage
      const rowsPerPageSelect = screen.getByRole("combobox", {
        name: "mui_table.rows_per_page"
      });

      await act(async () => {
        await userEvent.click(rowsPerPageSelect);
      });
      await act(async () => {
        await userEvent.click(screen.getByRole("option", { name: "20" }));
      });

      expect(getSponsorPurchases).toHaveBeenCalledWith(
        expect.anything(), // term
        1, // DEFAULT_CURRENT_PAGE — always reset on perPage change
        expect.anything(), // new perPage value (20)
        expect.anything(), // order
        expect.anything() // orderDir
      );
    });

    it("calls getSponsorPurchases with column key and reversed direction on sort", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        // No purchases → only sort buttons and pagination buttons in the DOM
        initialState: createInitialState({ order: "order", orderDir: 1 })
      });

      // "number" is the columnKey whose header text is "edit_sponsor.purchase_tab.order"
      // MUI TableSortLabel renders as a <button>
      await act(async () => {
        await userEvent.click(
          screen.getByRole("button", {
            name: /edit_sponsor\.purchase_tab\.order/i
          })
        );
      });

      expect(getSponsorPurchases).toHaveBeenCalledWith(
        expect.anything(), // term
        expect.anything(), // currentPage
        expect.anything(), // perPage
        "number", // columnKey
        -1 // sortDir (1) * -1
      );
    });
  });
});
