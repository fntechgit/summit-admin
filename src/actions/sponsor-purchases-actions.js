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
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import T from "i18n-react/dist/i18n-react";
import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE,
  DUMMY_ACTION,
  PURCHASE_STATUS
} from "../utils/constants";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";

export const REQUEST_SPONSOR_PURCHASES = "REQUEST_SPONSOR_PURCHASES";
export const RECEIVE_SPONSOR_PURCHASES = "RECEIVE_SPONSOR_PURCHASES";
export const SPONSOR_PURCHASE_STATUS_UPDATED =
  "SPONSOR_PURCHASE_STATUS_UPDATED";
export const RECEIVE_SPONSOR_ORDER = "RECEIVE_SPONSOR_ORDER";
export const SPONSOR_CLIENT_ADDRESS_UPDATED = "SPONSOR_CLIENT_ADDRESS_UPDATED";
export const SPONSOR_CLIENT_UPDATED = "SPONSOR_CLIENT_UPDATED";

export const getSponsorPurchases =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "created",
    orderDir = -1
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

export const approveSponsorPurchase =
  (paymentId) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    return putRequest(
      null,
      createAction(SPONSOR_PURCHASE_STATUS_UPDATED)({
        paymentId,
        status: PURCHASE_STATUS.PAID
      }),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/payments/${paymentId}/approve`,
      {},
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("edit_sponsor.purchase_tab.status_updated")
          })
        );
      })
      .catch(console.log) // need to catch promise reject
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const rejectSponsorPurchase =
  (paymentId) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    return deleteRequest(
      null,
      createAction(SPONSOR_PURCHASE_STATUS_UPDATED)({
        paymentId,
        status: PURCHASE_STATUS.CANCELLED
      }),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/payments/${paymentId}/cancel`,
      null,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("edit_sponsor.purchase_tab.status_updated")
          })
        );
      })
      .catch(console.log) // need to catch promise reject
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const getSponsorOrder = (orderId) => async (dispatch, getState) => {
  const { currentSummitState, currentSponsorState } = getState();
  const { currentSummit } = currentSummitState;
  const { entity: sponsor } = currentSponsorState;
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand:
      "forms,forms.items,forms.items.meta_fields,forms.items.type,refunds,payments,notes,fees"
  };

  return getRequest(
    null,
    createAction(RECEIVE_SPONSOR_ORDER),
    `${window.PURCHASES_API_URL}/api/v2/summits/${currentSummit.id}/sponsors/${sponsor.id}/purchases/${orderId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const updateClientAddress =
  (orderId, address) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(SPONSOR_CLIENT_ADDRESS_UPDATED),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/purchases/${orderId}/address`,
      address,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate(
              "edit_sponsor.purchase_tab.order_details.address_updated"
            )
          })
        );
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const updateClientInfo =
  (orderId, client) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(SPONSOR_CLIENT_UPDATED),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/purchases/${orderId}/client`,
      client,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate(
              "edit_sponsor.purchase_tab.order_details.client_updated"
            )
          })
        );
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const cancelSponsorForm =
  (orderId, lineId) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    return deleteRequest(
      null,
      createAction(DUMMY_ACTION),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/purchases/${orderId}/lines/${lineId}/cancel`,
      null,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => dispatch(getSponsorOrder(orderId)))
      .catch(console.log) // need to catch promise reject
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const undoCancelSponsorForm =
  (orderId, lineId) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(DUMMY_ACTION),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/purchases/${orderId}/lines/${lineId}/cancel`,
      {},
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => dispatch(getSponsorOrder(orderId)))
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const refundSponsorOrder =
  (orderId, amount, reason) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return postRequest(
      null,
      createAction(DUMMY_ACTION),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/purchases/${orderId}/refunds`,
      { amount, notes: reason },
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate(
              "edit_sponsor.purchase_tab.order_details.order_refunded"
            )
          })
        );
        dispatch(getSponsorOrder(orderId));
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  };
