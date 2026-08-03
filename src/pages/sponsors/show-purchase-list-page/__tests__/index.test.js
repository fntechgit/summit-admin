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
import { renderWithRedux } from "../../../../utils/test-utils";
import ShowPurchaseListPage from "../index";
import {
  getAllSponsorPurchases,
  downloadSponsorInvoice
} from "../../../../actions/sponsor-purchases-actions";
import { PURCHASE_METHODS, PURCHASE_STATUS } from "../../../../utils/constants";

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("../../../../actions/sponsor-purchases-actions", () => ({
  ...jest.requireActual("../../../../actions/sponsor-purchases-actions"),
  getAllSponsorPurchases: jest.fn(() => () => Promise.resolve()),
  exportAllSponsorPurchases: jest.fn(() => () => Promise.resolve()),
  approveSponsorPurchase: jest.fn(() => () => Promise.resolve()),
  rejectSponsorPurchase: jest.fn(() => () => Promise.resolve()),
  downloadSponsorInvoice: jest.fn(() => () => Promise.resolve())
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
  term: ""
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

    it("does not start a second download while one is already pending", async () => {
      const purchase = createPurchase({ id: 7, sponsor_id: 456 });
      let resolveDownload;
      downloadSponsorInvoice.mockImplementationOnce(
        () => () =>
          new Promise((resolve) => {
            resolveDownload = resolve;
          })
      );

      renderPage({ purchases: [purchase], totalCount: 1 });

      await act(async () => {
        await userEvent.click(getDownloadButtons()[0]);
      });

      // While the download is pending, the icon is swapped for a progress
      // spinner — there is no button left to click, so a second click can't
      // happen.
      expect(downloadSponsorInvoice).toHaveBeenCalledTimes(1);
      expect(queryDownloadButtons()).toHaveLength(0);

      await act(async () => {
        resolveDownload();
        await flushPromises();
      });

      expect(downloadSponsorInvoice).toHaveBeenCalledTimes(1);
      expect(getDownloadButtons()).toHaveLength(1);
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
});
