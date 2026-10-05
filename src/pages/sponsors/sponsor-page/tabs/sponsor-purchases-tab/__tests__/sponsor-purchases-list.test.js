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
import flushPromises from "flush-promises";
import { formatEpoch } from "openstack-uicore-foundation/lib/utils/methods";
import { renderWithRedux } from "../../../../../../utils/test-utils";
import SponsorPurchasesTab from "../index";
import {
  getSponsorPurchases,
  approveSponsorPurchase,
  rejectSponsorPurchase,
  downloadSponsorInvoice,
  changePurchasePaymentMethod
} from "../../../../../../actions/sponsor-purchases-actions";
import { getSponsorCart } from "../../../../../../actions/sponsor-cart-actions";
import showConfirmDialog from "../../../../../../components/mui/showConfirmDialog";
import history from "../../../../../../history";
import {
  PURCHASE_METHODS,
  PURCHASE_STATUS
} from "../../../../../../utils/constants";

// echo the key, plus the params so interpolated values can be asserted
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: {
    translate: (key, params) =>
      params ? `${key} ${Object.values(params).join(" ")}` : key
  }
}));

jest.mock("../../../../../../components/mui/showConfirmDialog", () =>
  jest.fn()
);

jest.mock("../../../../../../history", () => ({
  __esModule: true,
  default: { push: jest.fn() }
}));

jest.mock("../../../../../../actions/sponsor-cart-actions", () => ({
  getSponsorCart: jest.fn(() => () => Promise.resolve({ response: {} }))
}));

jest.mock("../../../../../../actions/sponsor-purchases-actions", () => ({
  ...jest.requireActual("../../../../../../actions/sponsor-purchases-actions"),
  getSponsorPurchases: jest.fn(() => () => Promise.resolve()),
  approveSponsorPurchase: jest.fn(() => () => Promise.resolve()),
  rejectSponsorPurchase: jest.fn(() => () => Promise.resolve()),
  downloadSponsorInvoice: jest.fn(() => () => Promise.resolve()),
  changePurchasePaymentMethod: jest.fn(() => () => Promise.resolve())
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    useSnackbarMessage: () => ({ errorMessage: jest.fn() })
  })
);

/**
 * SearchInput mock: plain <input> that fires onSearch on Enter key,
 * matching the real component behaviour without TextField overhead.
 */
jest.mock("openstack-uicore-foundation/lib/components/mui/search-input", () => {
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
  term: "",
  filters: {}
};

const createInitialState = (overrides = {}) => {
  const state = {
    ...DEFAULT_PURCHASE_LIST_STATE,
    ...overrides
  };

  const perPage = state.perPage || 10;
  const totalCount = state.totalCount || 0;
  const maxPage = Math.max(1, Math.ceil(totalCount / perPage));
  if (state.currentPage > maxPage) state.currentPage = maxPage;
  return {
    sponsorPagePurchaseListState: state,
    currentSponsorState: {
      entity: { id: 123 }
    },
    currentSummitState: {
      currentSummit: { id: 1 }
    }
  };
};

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

      expect(approveSponsorPurchase).toHaveBeenCalledWith(
        123,
        purchase.payment_id
      );
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

      expect(rejectSponsorPurchase).toHaveBeenCalledWith(
        123,
        purchase.payment_id
      );
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

      expect(approveSponsorPurchase).toHaveBeenCalledWith(
        123,
        purchase.payment_id
      );
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

      expect(rejectSponsorPurchase).toHaveBeenCalledWith(
        123,
        purchase.payment_id
      );
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

      expect(getSponsorPurchases).toHaveBeenCalledWith(
        "john",
        1, // DEFAULT_CURRENT_PAGE
        10, // perPage
        "order",
        1, // orderDir
        {} // filters
      );
    });

    it("calls getSponsorPurchases with the next page number when next-page is clicked", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({ currentPage: 1, totalCount: 25 })
      });

      // pagination now renders top and bottom, so take the first match
      await act(async () => {
        await userEvent.click(
          screen.getAllByRole("button", { name: "mui_table.next_page" })[0]
        );
      });

      expect(getSponsorPurchases).toHaveBeenCalledWith(
        expect.anything(), // term
        2, // page 1 + 1
        expect.anything(), // perPage
        expect.anything(), // order
        expect.anything(), // orderDir
        expect.anything() // filters
      );
    });

    it("calls getSponsorPurchases with new perPage and resets to page 1", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        // No purchases → no status combobox; the only combobox is rows-per-page
        initialState: createInitialState({ currentPage: 3, totalCount: 0 })
      });

      // pagination now renders top and bottom, so take the first match
      const [rowsPerPageSelect] = screen.getAllByRole("combobox", {
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
        expect.anything(), // orderDir
        expect.anything() // filters
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
        -1, // sortDir (1) * -1
        expect.anything() // filters
      );
    });
  });

  // -----------------------------------------------------------------------
  // Invoice download
  // -----------------------------------------------------------------------

  describe("Invoice download", () => {
    const DOWNLOAD_LABEL = "general.download_invoice";
    const getDownloadButton = () =>
      withinTableBody().getByRole("button", { name: DOWNLOAD_LABEL });
    const queryDownloadButton = () =>
      withinTableBody().queryByRole("button", { name: DOWNLOAD_LABEL });

    it("dispatches downloadSponsorInvoice with the row's order id and the current sponsor id", async () => {
      const purchase = createPurchase({ id: 7 });

      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [purchase],
          totalCount: 1
        })
      });

      await act(async () => {
        await userEvent.click(getDownloadButton());
      });

      // currentSponsorState.entity.id from createInitialState, not a row field
      expect(downloadSponsorInvoice).toHaveBeenCalledWith(purchase.id, 123);
    });

    it("does not start a second download while one is already pending", async () => {
      const purchase = createPurchase({ id: 7 });
      let resolveDownload;
      downloadSponsorInvoice.mockImplementationOnce(
        () => () =>
          new Promise((resolve) => {
            resolveDownload = resolve;
          })
      );

      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [purchase],
          totalCount: 1
        })
      });

      await act(async () => {
        await userEvent.click(getDownloadButton());
      });

      // While the download is pending, the icon is swapped for a progress
      // spinner — there is no button left to click, so a second click can't
      // happen.
      expect(downloadSponsorInvoice).toHaveBeenCalledTimes(1);
      expect(queryDownloadButton()).not.toBeInTheDocument();

      await act(async () => {
        resolveDownload();
        await flushPromises();
      });

      expect(downloadSponsorInvoice).toHaveBeenCalledTimes(1);
      expect(getDownloadButton()).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Pay by Card
  // -----------------------------------------------------------------------

  describe("Pay by Card", () => {
    const renderWithPurchase = (purchase) =>
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [purchase],
          totalCount: 1
        })
      });
    const openRowDropdown = async () => {
      await act(async () => {
        await userEvent.click(withinTableBody().getByRole("combobox"));
      });
    };
    const selectPayByCard = async () => {
      await openRowDropdown();
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", {
            name: "sponsor_show_purchases.pay_by_card"
          })
        );
      });
    };

    it("is offered after the statuses on a pending invoice row", async () => {
      renderWithPurchase(createPurchase({ net_amount: 10000 }));

      await openRowDropdown();

      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
        PURCHASE_STATUS.PENDING,
        PURCHASE_STATUS.PAID,
        PURCHASE_STATUS.CANCELLED,
        "sponsor_show_purchases.pay_by_card"
      ]);
    });

    it("is not offered when the net amount is 0", async () => {
      renderWithPurchase(createPurchase({ net_amount: 0 }));

      await openRowDropdown();

      expect(
        screen.queryByRole("option", {
          name: "sponsor_show_purchases.pay_by_card"
        })
      ).not.toBeInTheDocument();
    });

    it("sends no request and stays on Pending when the confirm dialog is cancelled", async () => {
      showConfirmDialog.mockResolvedValue(false);
      renderWithPurchase(createPurchase({ net_amount: 10000 }));

      await selectPayByCard();

      expect(changePurchasePaymentMethod).not.toHaveBeenCalled();
      expect(withinTableBody().getByRole("combobox")).toHaveTextContent(
        PURCHASE_STATUS.PENDING
      );
    });

    it("on confirm uses the current sponsor, loads its cart and opens the card payment screen", async () => {
      showConfirmDialog.mockResolvedValue(true);
      renderWithPurchase(createPurchase({ id: 7, net_amount: 10000 }));

      await selectPayByCard();
      await act(async () => {
        await flushPromises();
      });

      expect(changePurchasePaymentMethod).toHaveBeenCalledTimes(1);
      expect(changePurchasePaymentMethod).toHaveBeenCalledWith(123, 7);
      expect(getSponsorCart).toHaveBeenCalledWith("", 123);
      expect(history.push).toHaveBeenCalledWith("cart/payment");
    });

    it("does not navigate when the API rejects the change", async () => {
      showConfirmDialog.mockResolvedValue(true);
      changePurchasePaymentMethod.mockImplementationOnce(
        () => () => Promise.reject(new Error("412"))
      );
      renderWithPurchase(createPurchase({ net_amount: 10000 }));

      await selectPayByCard();
      await act(async () => {
        await flushPromises();
      });

      expect(getSponsorCart).not.toHaveBeenCalled();
      expect(history.push).not.toHaveBeenCalled();
    });

    it("does not navigate when the cart fails to load", async () => {
      showConfirmDialog.mockResolvedValue(true);
      // getSponsorCart swallows request errors and resolves without a response
      getSponsorCart.mockImplementationOnce(() => () => Promise.resolve());
      renderWithPurchase(createPurchase({ net_amount: 10000 }));

      await selectPayByCard();
      await act(async () => {
        await flushPromises();
      });

      expect(getSponsorCart).toHaveBeenCalledTimes(1);
      expect(history.push).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Card enabled indicator
  // -----------------------------------------------------------------------

  describe("Card enabled indicator", () => {
    const ENABLED_AT = 1767225600;

    it("shows the date and the user who enabled card payment", () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [
            createPurchase({
              payment_method: PURCHASE_METHODS.CARD,
              card_payment_enabled_at: ENABLED_AT,
              card_payment_enabled_by_full_name: "Jane Admin"
            })
          ],
          totalCount: 1
        })
      });

      expect(
        withinTableBody().getByLabelText(
          `sponsor_show_purchases.card_enabled_tooltip ${formatEpoch(
            ENABLED_AT,
            "YYYY/MM/DD HH:mm a"
          )} Jane Admin`
        )
      ).toBeInTheDocument();
    });

    it("shows nothing on orders that never had card payment enabled", () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          purchases: [createPurchase()],
          totalCount: 1
        })
      });

      expect(
        withinTableBody().queryByLabelText(
          /sponsor_show_purchases\.card_enabled_tooltip/
        )
      ).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Filters
  // -----------------------------------------------------------------------

  describe("Filters", () => {
    it("reloads page 1 with the new filter, keeping the term, page size, sort and the other filters", async () => {
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({
          term: "acme",
          currentPage: 2,
          perPage: 20,
          totalCount: 100,
          filters: { status: PURCHASE_STATUS.PENDING }
        })
      });

      await act(async () => {
        await userEvent.click(
          screen.getByRole("combobox", {
            name: /sponsor_show_purchases\.filters\.payment_method/
          })
        );
      });
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", {
            name: "sponsor_show_purchases.filters.payment_method_options.card"
          })
        );
      });

      expect(getSponsorPurchases).toHaveBeenLastCalledWith(
        "acme",
        1,
        20,
        "order",
        1,
        {
          status: PURCHASE_STATUS.PENDING,
          paymentMethod: PURCHASE_METHODS.CARD
        }
      );
    });

    it("keeps the filters when paging", async () => {
      const filters = { cardEnabled: true };
      renderWithRedux(<SponsorPurchasesTab />, {
        initialState: createInitialState({ totalCount: 25, filters })
      });

      await act(async () => {
        await userEvent.click(
          screen.getAllByRole("button", { name: "mui_table.next_page" })[0]
        );
      });

      expect(getSponsorPurchases).toHaveBeenLastCalledWith(
        "",
        2,
        10,
        "order",
        1,
        filters
      );
    });
  });
});
