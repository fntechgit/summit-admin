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

import sponsorPagePurchaseListReducer from "../sponsor-page-purchase-list-reducer";
import { REQUEST_SPONSOR_PURCHASES } from "../../../actions/sponsor-purchases-actions";
import { RECEIVE_SPONSOR } from "../../../actions/sponsor-actions";

const initialState = () =>
  sponsorPagePurchaseListReducer(undefined, { type: "@@INIT" });

const requestPurchases = (state, sponsorId) =>
  sponsorPagePurchaseListReducer(state, {
    type: REQUEST_SPONSOR_PURCHASES,
    payload: {
      order: "amount",
      orderDir: 1,
      page: 2,
      perPage: 50,
      term: "acme",
      filters: { status: "Paid" },
      sponsorId
    }
  });

const receiveSponsor = (state, id) =>
  sponsorPagePurchaseListReducer(state, {
    type: RECEIVE_SPONSOR,
    payload: { response: { id } }
  });

describe("sponsorPagePurchaseListReducer", () => {
  it("stores the sponsor the list was requested for", () => {
    const state = requestPurchases(initialState(), 10);

    expect(state.sponsorId).toBe(10);
  });

  it("clears filters, search, sort and paging when another sponsor is loaded", () => {
    const state = receiveSponsor(requestPurchases(initialState(), 10), 20);

    expect(state).toEqual(initialState());
  });

  it("keeps filters, search, sort and paging when the same sponsor is reloaded (browser refresh)", () => {
    const requested = requestPurchases(initialState(), 10);

    const state = receiveSponsor(requested, 10);

    expect(state).toBe(requested);
    expect(state.filters).toEqual({ status: "Paid" });
    expect(state.term).toBe("acme");
  });
});
