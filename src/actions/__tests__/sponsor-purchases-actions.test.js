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
  getRequest,
  snackbarErrorMsg
} from "openstack-uicore-foundation/lib/utils/actions";
import { generateInvoicePDF } from "openstack-uicore-foundation/lib/components/order-invoice-pdf";
import {
  getSponsorOrder,
  downloadSponsorInvoice,
  RECEIVE_SPONSOR_ORDER,
  CLEAR_SPONSOR_ORDER
} from "../sponsor-purchases-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
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

describe("getSponsorOrder", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  let capturedUrl;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedUrl = null;
    window.PURCHASES_API_URL = "https://purchases.example.com";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");

    getRequest.mockImplementation((reqAC, recAC, url) => {
      capturedUrl = url;
      return () => () => Promise.resolve({ response: { id: 55, forms: [] } });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.PURCHASES_API_URL;
  });

  it("builds the request URL using currentSponsorState.entity.id", async () => {
    const store = mockStore({
      currentSummitState: { currentSummit: { id: 1 } },
      currentSponsorState: { entity: { id: 123 } }
    });

    await store.dispatch(getSponsorOrder(55));
    await flushPromises();

    expect(capturedUrl).toBe(
      `${window.PURCHASES_API_URL}/api/v2/summits/1/sponsors/123/purchases/55`
    );
  });
});

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
    const dispatchedTypes = store.getActions().map((a) => a.type);
    // This fetch must never write into sponsorPagePurchaseListState —
    // that's SponsorOrderDetails' state, and clobbering/clearing it here
    // would blank an unrelated order-detail page open in another view.
    expect(dispatchedTypes).not.toContain(RECEIVE_SPONSOR_ORDER);
    expect(dispatchedTypes).not.toContain(CLEAR_SPONSOR_ORDER);
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
