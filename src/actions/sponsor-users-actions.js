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
  authErrorHandler,
  createAction,
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import T from "i18n-react/dist/i18n-react";
import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../utils/constants";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";

export const REQUEST_SPONSOR_USER_REQUESTS = "REQUEST_SPONSOR_USER_REQUESTS";
export const RECEIVE_SPONSOR_USER_REQUESTS = "RECEIVE_SPONSOR_USER_REQUESTS";
export const REQUEST_SPONSOR_USERS = "REQUEST_SPONSOR_USERS";
export const RECEIVE_SPONSOR_USERS = "RECEIVE_SPONSOR_USERS";
export const SPONSOR_USER_ADDED = "SPONSOR_USER_ADDED";

export const getSponsorUserRequests =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    const accessToken = await getAccessTokenSafely();
    const filter = [`summit_id==${currentSummit.id}`, "status==pending"];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`requester_email=@${escapedTerm},requester_first_name=@${escapedTerm},requester_last_name=@${escapedTerm}`);
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
      params.ordering = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_SPONSOR_USER_REQUESTS),
      createAction(RECEIVE_SPONSOR_USER_REQUESTS),
      `${window.SPONSOR_USERS_API_URL}/api/v1/access-requests`,
      authErrorHandler,
      { order, orderDir, page, term, perPage }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };


export const getSponsorUsers =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
    async (dispatch, getState) => {
      const { currentSummitState } = getState();
      const { currentSummit } = currentSummitState;
      const accessToken = await getAccessTokenSafely();
      const filter = [`summit_id==${currentSummit.id}`];

      dispatch(startLoading());

      if (term) {
        const escapedTerm = escapeFilterValue(term);
        filter.push(`user_email=@${escapedTerm},user_first_name=@${escapedTerm},user_last_name=@${escapedTerm}`);
      }

      const params = {
        page,
        per_page: perPage,
        expand: "access_rights,access_rights.groups",
        relations: "access_rights,access_rights.groups",
        fields: "id,first_name,last_name,email,active,access_rights.groups.name",
        access_token: accessToken
      };

      if (filter.length > 0) {
        params["filter[]"] = filter;
      }

      // order
      if (order != null && orderDir != null) {
        const orderDirSign = orderDir === 1 ? "" : "-";
        params.ordering = `${orderDirSign}${order}`;
      }

      return getRequest(
        createAction(REQUEST_SPONSOR_USERS),
        createAction(RECEIVE_SPONSOR_USERS),
        `${window.SPONSOR_USERS_API_URL}/api/v1/sponsor-users`,
        authErrorHandler,
        { order, orderDir, page, term, perPage }
      )(params)(dispatch).then(() => {
        dispatch(stopLoading());
      });
    };


export const addSponsorUser =
  () => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return postRequest(
      null,
      createAction(SPONSOR_USER_ADDED),
      `${window.SPONSOR_USERS_API_URL}/api/v1/sponsor-users`,
      {
        "user_email": "santipalenque@gmail.com",
        "sponsor_id": 359,
        "summit_id": currentSummit.id
      },
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate(
              "sponsor_form_item_list.add_from_inventory.items_added"
            )
          })
        );
      })
      .catch(console.log) // need to catch promise reject
      .finally(() => {
        dispatch(stopLoading());
      });
  };