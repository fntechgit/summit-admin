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

import React from "react";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import flushPromises from "flush-promises";
import { formatEpoch } from "openstack-uicore-foundation/lib/utils/methods";
import { renderWithRedux } from "../../../../utils/test-utils";
import ShowPurchaseListPage from "../index";
import {
  approveSponsorPurchase,
  changePurchasePaymentMethod,
  exportAllSponsorPurchases,
  getAllSponsorPurchases,
  downloadSponsorInvoice,
  rejectSponsorPurchase
} from "../../../../actions/sponsor-purchases-actions";
import { getSponsorCart } from "../../../../actions/sponsor-cart-actions";
import showConfirmDialog from "../../../../components/mui/showConfirmDialog";
import history from "../../../../history";
import {
  PURCHASE_METHOD_FILTER_OTHER,
  PURCHASE_METHODS,
  PURCHASE_STATUS
} from "../../../../utils/constants";

// echo the key, plus the params so interpolated values can be asserted
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: {
    translate: (key, params) =>
      params ? `${key} ${Object.values(params).join(" ")}` : key
  }
}));

jest.mock("../../../../components/mui/showConfirmDialog", () => jest.fn());

jest.mock("../../../../history", () => ({
  __esModule: true,
  default: { push: jest.fn() }
}));

jest.mock("../../../../actions/sponsor-cart-actions", () => ({
  getSponsorCart: jest.fn(() => () => Promise.resolve())
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("../../../../actions/sponsor-purchases-actions", () => ({
  ...jest.requireActual("../../../../actions/sponsor-purchases-actions"),
  getAllSponsorPurchases: jest.fn(() => () => Promise.resolve()),
  exportAllSponsorPurchases: jest.fn(() => () => Promise.resolve()),
  approveSponsorPurchase: jest.fn(() => () => Promise.resolve()),
  rejectSponsorPurchase: jest.fn(() => () => Promise.resolve()),
  downloadSponsorInvoice: jest.fn(() => () => Promise.resolve()),
  changePurchasePaymentMethod: jest.fn(() => () => Promise.resolve())
}));

/**
 * SearchInput mock: plain <input> that fires onSearch on Enter key,
 * matching the real component behaviour without TextField overhead.
 */
jest.mock("openstack-uicore-foundation/lib/components/mui/search-input", () => {
  const ReactLib = require("react");
  return {
    __esModule: true,
    default: ({ onSearch, term }) => {
      const handleKeyDown = (e) => {
        if (e.key === "Enter") onSearch(e.target.value);
      };
      return ReactLib.createElement("input", {
        "data-testid": "search-input",
        defaultValue: term || "",
        onKeyDown: handleKeyDown
      });
    }
  };
});

// ---- Helpers ----

const DEFAULT_LIST_STATE = {
  purchases: [],
  order: "created",
  orderDir: -1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  term: "",
  filters: {}
};

const createInitialState = (overrides = {}) => ({
  showPurchaseListState: { ...DEFAULT_LIST_STATE, ...overrides }
});

const createPurchase = (overrides = {}) => ({
  id: 1,
  payment_id: 101,
  number: "ORD-001",
  purchased: "2024/01/01 10:00 am",
  sponsor_id: 456,
  sponsor_name: "Acme Co",
  payment_method: PURCHASE_METHODS.INVOICE,
  status: PURCHASE_STATUS.PENDING,
  amount: "$100.00",
  net_amount: 10000,
  ...overrides
});

/**
 * Returns a within()-scoped helper targeting the table body rows.
 * TablePagination also renders a combobox (rows-per-page Select) outside
 * the <tbody>, so scoping to tbody isolates status-column assertions from
 * pagination controls.
 */
const withinTableBody = () => {
  const [, tbody] = screen.getAllByRole("rowgroup");
  return within(tbody);
};

const renderPage = (overrides = {}) =>
  renderWithRedux(<ShowPurchaseListPage match={{ url: "/purchases" }} />, {
    initialState: createInitialState(overrides)
  });

// ---- Tests ----

describe("ShowPurchaseListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Grid refresh behavior", () => {
    it("calls getAllSponsorPurchases once on initial mount", () => {
      renderPage();

      expect(getAllSponsorPurchases).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // Invoice download
  // -----------------------------------------------------------------------

  describe("Invoice download", () => {
    const DOWNLOAD_LABEL = "general.download_invoice";
    const getDownloadButtons = () =>
      withinTableBody().getAllByRole("button", { name: DOWNLOAD_LABEL });
    const queryDownloadButtons = () =>
      withinTableBody().queryAllByRole("button", { name: DOWNLOAD_LABEL });

    it("dispatches downloadSponsorInvoice with the row's order and sponsor ids", async () => {
      const purchase = createPurchase({ id: 7, sponsor_id: 456 });

      renderPage({ purchases: [purchase], totalCount: 1 });

      await act(async () => {
        await userEvent.click(getDownloadButtons()[0]);
      });

      expect(downloadSponsorInvoice).toHaveBeenCalledWith(
        purchase.id,
        purchase.sponsor_id
      );
    });

    it("only replaces the downloading row's icon with a spinner and disables the other rows, instead of swapping every row", async () => {
      const purchaseA = createPurchase({
        id: 7,
        sponsor_id: 456,
        number: "ORD-007"
      });
      const purchaseB = createPurchase({
        id: 8,
        sponsor_id: 789,
        number: "ORD-008"
      });
      let resolveDownload;
      downloadSponsorInvoice.mockImplementationOnce(
        () => () =>
          new Promise((resolve) => {
            resolveDownload = resolve;
          })
      );

      renderPage({ purchases: [purchaseA, purchaseB], totalCount: 2 });

      const [firstRowButton] = getDownloadButtons();

      await act(async () => {
        await userEvent.click(firstRowButton);
      });

      // Only one row's button remains — the other row's icon became a spinner.
      const remainingButtons = queryDownloadButtons();
      expect(remainingButtons).toHaveLength(1);
      // The remaining row is disabled while a download is in flight elsewhere.
      expect(remainingButtons[0]).toBeDisabled();
      expect(downloadSponsorInvoice).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveDownload();
        await flushPromises();
      });

      // Both rows are interactive again once the download settles.
      expect(getDownloadButtons()).toHaveLength(2);
      expect(getDownloadButtons()[0]).not.toBeDisabled();
      expect(getDownloadButtons()[1]).not.toBeDisabled();
    });
  });

  // -----------------------------------------------------------------------
  // Status dropdown and Pay by Card
  // -----------------------------------------------------------------------

  describe("Status dropdown", () => {
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

    it("offers Pending, Paid, Canceled and Pay by Card on a pending invoice row", async () => {
      renderPage({ purchases: [createPurchase()], totalCount: 1 });

      await openRowDropdown();

      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
        PURCHASE_STATUS.PENDING,
        PURCHASE_STATUS.PAID,
        PURCHASE_STATUS.CANCELLED,
        "sponsor_show_purchases.pay_by_card"
      ]);
    });

    it("does not offer Pay by Card when the net amount is 0", async () => {
      renderPage({
        purchases: [createPurchase({ net_amount: 0 })],
        totalCount: 1
      });

      await openRowDropdown();

      expect(
        screen.queryByRole("option", {
          name: "sponsor_show_purchases.pay_by_card"
        })
      ).not.toBeInTheDocument();
    });

    it("sends no request and stays on Pending when the confirm dialog is cancelled", async () => {
      showConfirmDialog.mockResolvedValue(false);
      renderPage({ purchases: [createPurchase()], totalCount: 1 });

      await selectPayByCard();

      expect(showConfirmDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "sponsor_show_purchases.pay_by_card_warning"
        })
      );
      expect(changePurchasePaymentMethod).not.toHaveBeenCalled();
      expect(withinTableBody().getByRole("combobox")).toHaveTextContent(
        PURCHASE_STATUS.PENDING
      );
    });

    it("on confirm changes the payment method with the row's sponsor, loads that sponsor's cart and opens its card payment screen", async () => {
      showConfirmDialog.mockResolvedValue(true);
      const purchase = createPurchase({ id: 7, sponsor_id: 456 });
      renderPage({ purchases: [purchase], totalCount: 1 });

      await selectPayByCard();
      await act(async () => {
        await flushPromises();
      });

      expect(changePurchasePaymentMethod).toHaveBeenCalledTimes(1);
      expect(changePurchasePaymentMethod).toHaveBeenCalledWith(456, 7);
      expect(getSponsorCart).toHaveBeenCalledWith("", 456);
      expect(history.push).toHaveBeenCalledWith("456/cart/payment");
    });

    it("does not load the cart nor navigate when the API rejects the change", async () => {
      showConfirmDialog.mockResolvedValue(true);
      changePurchasePaymentMethod.mockImplementationOnce(
        () => () => Promise.reject(new Error("412"))
      );
      renderPage({ purchases: [createPurchase()], totalCount: 1 });

      await selectPayByCard();
      await act(async () => {
        await flushPromises();
      });

      expect(getSponsorCart).not.toHaveBeenCalled();
      expect(history.push).not.toHaveBeenCalled();
      expect(withinTableBody().getByRole("combobox")).toHaveTextContent(
        PURCHASE_STATUS.PENDING
      );
    });

    it("selecting Paid approves with the row's sponsor and payment ids, without a confirm dialog", async () => {
      const purchase = createPurchase({ sponsor_id: 456, payment_id: 101 });
      renderPage({ purchases: [purchase], totalCount: 1 });

      await openRowDropdown();
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: PURCHASE_STATUS.PAID })
        );
      });

      expect(approveSponsorPurchase).toHaveBeenCalledWith(456, 101);
      expect(showConfirmDialog).not.toHaveBeenCalled();
      expect(changePurchasePaymentMethod).not.toHaveBeenCalled();
    });

    it("selecting Canceled rejects with the row's sponsor and payment ids", async () => {
      const purchase = createPurchase({ sponsor_id: 456, payment_id: 101 });
      renderPage({ purchases: [purchase], totalCount: 1 });

      await openRowDropdown();
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: PURCHASE_STATUS.CANCELLED })
        );
      });

      expect(rejectSponsorPurchase).toHaveBeenCalledWith(456, 101);
      expect(changePurchasePaymentMethod).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Card enabled indicator
  // -----------------------------------------------------------------------

  describe("Card enabled indicator", () => {
    const ENABLED_AT = 1767225600;

    it("shows the date and the user who enabled card payment", () => {
      renderPage({
        purchases: [
          createPurchase({
            payment_method: PURCHASE_METHODS.CARD,
            card_payment_enabled_at: ENABLED_AT,
            card_payment_enabled_by_full_name: "Jane Admin"
          })
        ],
        totalCount: 1
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
      renderPage({ purchases: [createPurchase()], totalCount: 1 });

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
    const selectFilterOption = async (filterLabel, optionLabel) => {
      await act(async () => {
        await userEvent.click(
          screen.getByRole("combobox", { name: new RegExp(filterLabel) })
        );
      });
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: optionLabel })
        );
      });
    };

    it("reloads page 1 with the new filter, keeping the term, page size, sort and the other filters", async () => {
      renderPage({
        term: "acme",
        currentPage: 3,
        perPage: 20,
        totalCount: 100,
        filters: { paymentMethod: PURCHASE_METHODS.INVOICE }
      });

      await selectFilterOption(
        "sponsor_show_purchases.filters.status",
        "sponsor_show_purchases.filters.status_options.paid"
      );

      expect(getAllSponsorPurchases).toHaveBeenLastCalledWith(
        "acme",
        1,
        20,
        "created",
        -1,
        {
          paymentMethod: PURCHASE_METHODS.INVOICE,
          status: PURCHASE_STATUS.PAID
        }
      );
    });

    it("sends cardEnabled false when filtering by card not enabled", async () => {
      renderPage();

      await selectFilterOption(
        "sponsor_show_purchases.filters.card_enabled",
        "general.no"
      );

      expect(getAllSponsorPurchases).toHaveBeenLastCalledWith(
        "",
        1,
        10,
        "created",
        -1,
        { cardEnabled: false }
      );
    });

    it("offers Other as a payment method filter", async () => {
      renderPage();

      await selectFilterOption(
        "sponsor_show_purchases.filters.payment_method",
        "sponsor_show_purchases.filters.payment_method_options.other"
      );

      expect(getAllSponsorPurchases).toHaveBeenLastCalledWith(
        "",
        1,
        10,
        "created",
        -1,
        { paymentMethod: PURCHASE_METHOD_FILTER_OTHER }
      );
    });

    it("keeps the filters when searching", async () => {
      const filters = { status: PURCHASE_STATUS.PENDING, cardEnabled: true };
      renderPage({ filters });

      await act(async () => {
        await userEvent.type(screen.getByTestId("search-input"), "john{Enter}");
      });

      expect(getAllSponsorPurchases).toHaveBeenLastCalledWith(
        "john",
        1,
        10,
        "created",
        -1,
        filters
      );
    });

    it("exports with the same filters as the list", async () => {
      const filters = { paymentMethod: PURCHASE_METHODS.CARD };
      renderPage({ term: "acme", filters });

      await act(async () => {
        await userEvent.click(
          screen.getByRole("button", { name: "general.export" })
        );
      });

      expect(exportAllSponsorPurchases).toHaveBeenCalledWith(
        "acme",
        "created",
        -1,
        filters
      );
    });
  });
});
