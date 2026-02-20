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
  deleteRequest,
  putRequest,
  postRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";

import T from "i18n-react";
import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  ERROR_CODE_404
} from "../utils/constants";

export const REQUEST_SPONSOR_CART = "REQUEST_SPONSOR_CART";
export const RECEIVE_SPONSOR_CART = "RECEIVE_SPONSOR_CART";
export const SPONSOR_CART_FORM_DELETED = "SPONSOR_CART_FORM_DELETED";
export const SPONSOR_CART_FORM_LOCKED = "SPONSOR_CART_FORM_LOCKED";
export const REQUEST_CART_AVAILABLE_FORMS = "REQUEST_CART_AVAILABLE_FORMS";
export const RECEIVE_CART_AVAILABLE_FORMS = "RECEIVE_CART_AVAILABLE_FORMS";
export const RECEIVE_CART_SPONSOR_FORM = "RECEIVE_CART_SPONSOR_FORM";
export const FORM_CART_SAVED = "FORM_CART_SAVED";

const customErrorHandler = (err, res) => (dispatch, state) => {
  const code = err.status;
  dispatch(stopLoading());
  switch (code) {
    case ERROR_CODE_404:
      break;
    default:
      authErrorHandler(err, res)(dispatch, state);
  }
};

export const getSponsorCart =
  (term = "") =>
  async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: sponsorId }
    } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();
    const summitTZ = currentSummit.time_zone.name;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm},code=@${escapedTerm}`);
    }

    const params = {
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    return getRequest(
      createAction(REQUEST_SPONSOR_CART),
      createAction(RECEIVE_SPONSOR_CART),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsorId}/carts/current`,
      customErrorHandler,
      { term, summitTZ }
    )(params)(dispatch)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const deleteSponsorCartForm = (formId) => async (dispatch, getState) => {
  const { currentSummitState, currentSponsorState } = getState();
  const { currentSummit } = currentSummitState;
  const {
    entity: { id: sponsorId }
  } = currentSponsorState;
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(SPONSOR_CART_FORM_DELETED)({ formId }),
    `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsorId}/carts/current/forms/${formId}`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      getSponsorCart()(dispatch, getState);
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_forms.form_delete_success")
        })
      );
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const lockSponsorCartForm = (formId) => async (dispatch, getState) => {
  const { currentSummitState, currentSponsorState } = getState();
  const { currentSummit } = currentSummitState;
  const { entity: sponsor } = currentSponsorState;

  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  putRequest(
    null,
    createAction(SPONSOR_CART_FORM_LOCKED)({ formId, is_locked: true }),
    `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/carts/current/forms/${formId}/lock`,
    {},
    snackbarErrorHandler
  )(params)(dispatch)
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const unlockSponsorCartForm = (formId) => async (dispatch, getState) => {
  const { currentSummitState, currentSponsorState } = getState();
  const { currentSummit } = currentSummitState;
  const { entity: sponsor } = currentSponsorState;
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(SPONSOR_CART_FORM_LOCKED)({ formId, is_locked: false }),
    `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/carts/current/forms/${formId}/lock`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};


export const getSponsorFormsForCart =
  (
    term = "",
    currentPage = DEFAULT_CURRENT_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
  ) =>
    async (dispatch, getState) => {
      const { currentSummitState } = getState();
      const { currentSummit } = currentSummitState;
      const accessToken = await getAccessTokenSafely();
      const filter = ["has_items==1"];

      dispatch(startLoading());

      if (term) {
        const escapedTerm = escapeFilterValue(term);
        filter.push(`name=@${escapedTerm},code=@${escapedTerm}`);
      }

      const params = {
        page: currentPage,
        fields: "id,code,name,items",
        per_page: DEFAULT_PER_PAGE,
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
        createAction(REQUEST_CART_AVAILABLE_FORMS),
        createAction(RECEIVE_CART_AVAILABLE_FORMS),
        `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/show-forms`,
        authErrorHandler,
        {term, order, orderDir, currentPage}
      )(params)(dispatch).then(() => {
        dispatch(stopLoading());
      });
    };

// get sponsor show form by id USING V2 API
export const getSponsorForm = (formId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_CART_SPONSOR_FORM),
    `${window.PURCHASES_API_URL}/api/v2/summits/${currentSummit.id}/show-forms/${formId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const addCartForm = (formId, addOnId, items) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = {
    form_id: formId,
    add_on_id: addOnId,
    items: items.map((item) => ({
      quantity: item.quantity,
      add_on_item_id: item.id
    }))
  }

  return postRequest(
    null,
    createAction(FORM_CART_SAVED),
    `${window.API_BASE_URL}/api/v2/summits/${currentSummit.id}/sponsors`,
    normalizedEntity,
    snackbarErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(
      snackbarSuccessHandler({
        title: T.translate("general.success"),
        html: T.translate("sponsor_list.sponsor_added")
      })
    );
  });
};