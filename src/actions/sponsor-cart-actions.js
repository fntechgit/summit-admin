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
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";

import T from "i18n-react";
import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";
import { ERROR_CODE_404 } from "../utils/constants";

export const REQUEST_SPONSOR_CART = "REQUEST_SPONSOR_CART";
export const RECEIVE_SPONSOR_CART = "RECEIVE_SPONSOR_CART";
export const SPONSOR_CART_FORM_DELETED = "SPONSOR_CART_FORM_DELETED";
export const SPONSOR_CART_FORM_LOCKED = "SPONSOR_CART_FORM_LOCKED";

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
    `${window.SPONSOR_USERS_API_URL}/api/v1/shows/${currentSummit.id}/sponsors/${sponsor.id}/carts/current/forms/${formId}/lock`,
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
    `${window.SPONSOR_USERS_API_URL}/api/v1/shows/${currentSummit.id}/sponsors/${sponsor.id}/carts/current/forms/${formId}/lock`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};
