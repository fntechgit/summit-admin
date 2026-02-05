/**
 * Copyright 2018 OpenStack Foundation
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
  createAction,
  getRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../utils/constants";
import { snackbarErrorHandler } from "./base-actions";

export const REQUEST_SPONSOR_MEDIA_UPLOADS = "REQUEST_SPONSOR_MEDIA_UPLOADS";
export const RECEIVE_SPONSOR_MEDIA_UPLOADS = "RECEIVE_SPONSOR_MEDIA_UPLOADS";

export const getSponsorMURequests =
  (
    currentPage = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const summitTZ = currentSummit.time_zone.name;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      page: currentPage,
      // fields: "id,code,name,level,expire_date",
      // relations: "add_ons",
      per_page: perPage,
      access_token: accessToken
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_SPONSOR_MEDIA_UPLOADS),
      createAction(RECEIVE_SPONSOR_MEDIA_UPLOADS),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/custom-media-request-modules`,
      snackbarErrorHandler,
      { order, orderDir, currentPage, perPage, summitTZ }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
