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

import {
  authErrorHandler,
  createAction,
  getRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";

import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../utils/constants";

export const REQUEST_SPONSOR_PURCHASES = "REQUEST_SPONSOR_PURCHASES";
export const RECEIVE_SPONSOR_PURCHASES = "RECEIVE_SPONSOR_PURCHASES";

export const getSponsorPurchases =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `number==${escapedTerm},purchased_by_email=@${escapedTerm},purchased_by_full_name=@${escapedTerm}`
      );
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_SPONSOR_PURCHASES),
      createAction(RECEIVE_SPONSOR_PURCHASES),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/purchases`,
      authErrorHandler,
      { order, orderDir, page, perPage, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
