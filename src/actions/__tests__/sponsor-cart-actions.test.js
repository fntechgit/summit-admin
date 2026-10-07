/**
 * Copyright 2026 OpenStack Foundation
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
  postRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { payWithInvoice } from "../sponsor-cart-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  postRequest: jest.fn()
}));

describe("payWithInvoice", () => {
  const mockStore = configureStore([thunk]);
  let postedUrl;
  let postedPayload;

  beforeEach(() => {
    jest.clearAllMocks();
    window.PURCHASES_API_URL = "https://purchases.example.com";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    postRequest.mockImplementation((_req, _rec, url, payload) => {
      postedUrl = url;
      postedPayload = payload;
      return () => () => Promise.resolve({ response: {} });
    });
    getRequest.mockImplementation(
      () => () => () => Promise.resolve({ response: {} })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.PURCHASES_API_URL;
  });

  const buildStore = () =>
    mockStore({
      currentSummitState: {
        currentSummit: { id: 1, time_zone: { name: "UTC" } }
      },
      currentSponsorState: { entity: { id: 123 } },
      sponsorPageCartListState: { cart: { id: 55 } }
    });

  it("posts the invoice payment for the current sponsor by default", async () => {
    await buildStore().dispatch(payWithInvoice());

    expect(postedUrl).toBe(
      "https://purchases.example.com/api/v1/summits/1/sponsors/123/payments"
    );
    expect(postedPayload).toEqual({ type: "Offline", cart_id: 55 });
  });

  it("posts for the given sponsor and reloads that sponsor's cart, for callers outside the sponsor page", async () => {
    await buildStore().dispatch(payWithInvoice(456));

    expect(postedUrl).toBe(
      "https://purchases.example.com/api/v1/summits/1/sponsors/456/payments"
    );
    await flushPromises();
    const [, , cartUrl] = getRequest.mock.calls[0];
    expect(cartUrl).toContain("/sponsors/456/carts/current");
  });
});
