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

import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getCSV,
  getRequest,
  putRequest,
  snackbarErrorMsg
} from "openstack-uicore-foundation/lib/utils/actions";
import { generateInvoicePDF } from "openstack-uicore-foundation/lib/components/order-invoice-pdf";
import {
  changePurchasePaymentMethod,
  downloadSponsorInvoice,
  exportAllSponsorPurchases,
  getAllSponsorPurchases,
  getSponsorPurchases
} from "../sponsor-purchases-actions";
import * as methods from "../../utils/methods";
import {
  PURCHASE_METHOD_FILTER_OTHER,
  PURCHASE_METHODS
} from "../../utils/constants";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  putRequest: jest.fn(),
  getCSV: jest.fn(() => ({ type: "GET_CSV_MOCK" })),
  snackbarErrorMsg: jest.fn((payload) => ({
    type: "SNACKBAR_ERROR_MSG_MOCK",
    payload
  }))
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/order-invoice-pdf",
  () => ({
    generateInvoicePDF: jest.fn(() => Promise.resolve())
  })
);

describe("downloadSponsorInvoice", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  let capturedUrl;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedUrl = null;
    window.PURCHASES_API_URL = "https://purchases.example.com";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.PURCHASES_API_URL;
  });

  const buildStore = () =>
    mockStore({
      currentSummitState: { currentSummit: { id: 1 } },
      currentSponsorState: { entity: { id: 123 } }
    });

  it("fetches the order for the explicit sponsorId, generates the PDF with the raw order and currentSummit, and never touches the shared order-detail state", async () => {
    const fetchedOrder = { id: 7, forms: [] };
    getRequest.mockImplementation((reqAC, recAC, url) => {
      capturedUrl = url;
      return () => () => Promise.resolve({ response: fetchedOrder });
    });

    const store = buildStore();
    await store.dispatch(downloadSponsorInvoice(7, 456));
    await flushPromises();

    expect(capturedUrl).toBe(
      `${window.PURCHASES_API_URL}/api/v2/summits/1/sponsors/456/purchases/7`
    );
    expect(generateInvoicePDF).toHaveBeenCalledWith(
      fetchedOrder,
      { id: 1 },
      expect.objectContaining({ logoSrc: expect.anything() })
    );
    expect(snackbarErrorMsg).not.toHaveBeenCalled();
  });

  it("swallows the order-fetch rejection silently since authErrorHandler already surfaced it", async () => {
    getRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("Network error"))
    );

    const store = buildStore();
    await store.dispatch(downloadSponsorInvoice(7, 456));
    await flushPromises();

    expect(generateInvoicePDF).not.toHaveBeenCalled();
    // No second, stacked error UI on top of authErrorHandler's own message.
    expect(snackbarErrorMsg).not.toHaveBeenCalled();
  });

  it("shows an error message when PDF generation rejects", async () => {
    getRequest.mockImplementation(
      () => () => () => Promise.resolve({ response: { id: 7, forms: [] } })
    );
    generateInvoicePDF.mockRejectedValueOnce(new Error("PDF error"));

    const store = buildStore();
    await store.dispatch(downloadSponsorInvoice(7, 456));
    await flushPromises();

    expect(snackbarErrorMsg).toHaveBeenCalledWith(
      expect.objectContaining({ html: "errors.invoice_generation" })
    );
  });
});

describe("purchase list filters", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const FILTERS = {
    status: "Paid",
    paymentMethod: PURCHASE_METHODS.INVOICE,
    cardEnabled: true
  };
  let capturedParams;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedParams = null;
    window.PURCHASES_API_URL = "https://purchases.example.com";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(() => (params) => {
      capturedParams = params;
      return () => Promise.resolve({ response: { data: [] } });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.PURCHASES_API_URL;
  });

  const buildStore = () =>
    mockStore({
      currentSummitState: { currentSummit: { id: 1 } },
      currentSponsorState: { entity: { id: 123 } }
    });

  it("getAllSponsorPurchases sends the status, payment method and card enabled filters next to the search term", async () => {
    await buildStore().dispatch(
      getAllSponsorPurchases("acme", 1, 10, "created", -1, FILTERS)
    );

    expect(capturedParams["filter[]"]).toEqual([
      "number==acme,sponsor_company_name=@acme,purchased_by_email=@acme,purchased_by_full_name=@acme",
      "status==Paid",
      `payment_method==${PURCHASE_METHODS.INVOICE}`,
      "card_payment_enabled==true"
    ]);
  });

  it("sends card_payment_enabled==false when filtering by card not enabled", async () => {
    await buildStore().dispatch(
      getAllSponsorPurchases("", 1, 10, "created", -1, { cardEnabled: false })
    );

    expect(capturedParams["filter[]"]).toEqual(["card_payment_enabled==false"]);
  });

  it("sends not card and not invoice when filtering by other payment methods", async () => {
    await buildStore().dispatch(
      getAllSponsorPurchases("", 1, 10, "created", -1, {
        paymentMethod: PURCHASE_METHOD_FILTER_OTHER
      })
    );

    expect(capturedParams["filter[]"]).toEqual([
      `payment_method_not_in==${PURCHASE_METHODS.CARD}&&${PURCHASE_METHODS.INVOICE}`
    ]);
  });

  it("sends no filter when none is set", async () => {
    await buildStore().dispatch(getAllSponsorPurchases());

    expect(capturedParams["filter[]"]).toBeUndefined();
  });

  it("requests the card payment enabled fields for the indicator", async () => {
    await buildStore().dispatch(getAllSponsorPurchases());

    expect(capturedParams.fields.split(",")).toEqual(
      expect.arrayContaining([
        "card_payment_enabled_at",
        "card_payment_enabled_by_full_name"
      ])
    );
  });

  it("getSponsorPurchases sends the same filters", async () => {
    await buildStore().dispatch(
      getSponsorPurchases("", 1, 10, "created", -1, FILTERS)
    );

    expect(capturedParams["filter[]"]).toEqual([
      "status==Paid",
      `payment_method==${PURCHASE_METHODS.INVOICE}`,
      "card_payment_enabled==true"
    ]);
  });

  it("getSponsorPurchases tags the request with the sponsor, so the list can be cleared on a sponsor change", async () => {
    await buildStore().dispatch(getSponsorPurchases());

    const [, , , , requestPayload] = getRequest.mock.calls[0];
    expect(requestPayload).toEqual(expect.objectContaining({ sponsorId: 123 }));
  });

  it("exportAllSponsorPurchases sends the same filters as the list", async () => {
    await buildStore().dispatch(
      exportAllSponsorPurchases("acme", "created", -1, FILTERS)
    );

    const [, csvParams] = getCSV.mock.calls[0];
    expect(csvParams["filter[]"]).toEqual([
      "number==acme,sponsor_company_name=@acme,purchased_by_email=@acme,purchased_by_full_name=@acme",
      "status==Paid",
      `payment_method==${PURCHASE_METHODS.INVOICE}`,
      "card_payment_enabled==true"
    ]);
  });
});

describe("changePurchasePaymentMethod", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  beforeEach(() => {
    jest.clearAllMocks();
    window.PURCHASES_API_URL = "https://purchases.example.com";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.PURCHASES_API_URL;
  });

  const buildStore = () =>
    mockStore({
      currentSummitState: { currentSummit: { id: 1 } },
      currentSponsorState: { entity: { id: 123 } }
    });

  it("sends one PUT to the purchase change-payment-method endpoint of the given sponsor with an empty payload", async () => {
    putRequest.mockImplementation(() => () => () => Promise.resolve());

    await buildStore().dispatch(changePurchasePaymentMethod(456, 7));

    expect(putRequest).toHaveBeenCalledTimes(1);
    const [, , url, payload] = putRequest.mock.calls[0];
    expect(url).toBe(
      `${window.PURCHASES_API_URL}/api/v1/summits/1/sponsors/456/purchases/7/change-payment-method`
    );
    expect(payload).toEqual({});
  });

  it("rejects on API error so the caller does not navigate", async () => {
    const error = { status: 412 };
    putRequest.mockImplementation(() => () => () => Promise.reject(error));

    await expect(
      buildStore().dispatch(changePurchasePaymentMethod(456, 7))
    ).rejects.toBe(error);
  });
});
