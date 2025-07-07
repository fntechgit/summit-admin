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

import T from "i18n-react";
import {
  authErrorHandler,
  createAction,
  getRequest,
  postRequest,
  putRequest,
  showSuccessMessage,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import moment from "moment-timezone";
import { getAccessTokenSafely } from "../utils/methods";
import { ERROR_CODE_404 } from "../utils/constants";

export const REQUEST_SPONSOR_SETTINGS = "REQUEST_SPONSOR_SETTINGS";
export const RECEIVE_USER_SPONSOR_SETTINGS = "RECEIVE_USER_SPONSOR_SETTINGS";
export const RECEIVE_PURCHASE_SPONSOR_SETTINGS =
  "RECEIVE_PURCHASE_SPONSOR_SETTINGS";
export const SPONSOR_PURCHASE_SETTINGS_UPDATED =
  "SPONSOR_PURCHASE_SETTINGS_UPDATED";
export const SPONSOR_USER_SETTINGS_UPDATED = "SPONSOR_USER_SETTINGS_UPDATED";
export const SET_EMPTY_PURCHASES_SETTINGS = "SET_EMPTY_PURCHASES_SETTINGS";
export const SET_EMPTY_SPONSOR_USERS_SETTINGS =
  "SET_EMPTY_SPONSOR_USERS_SETTINGS";

export const getSponsorPurchasesMeta = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    createAction(REQUEST_SPONSOR_SETTINGS),
    createAction(RECEIVE_PURCHASE_SPONSOR_SETTINGS),
    `${window.PURCHASES_API_URL}/api/v1/shows-metadata/${currentSummit.id}`,
    (err, res) => customErrorHandler(err, res, SET_EMPTY_PURCHASES_SETTINGS)
  )(params)(dispatch)
    .catch(() => {})
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const saveSponsorPurchasesMeta =
  (entity) => async (dispatch, getState) => {
    const { currentSummitState, sponsorSettingsState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const { emptyPurchaseSettings } = sponsorSettingsState;

    const params = {
      access_token: accessToken
    };

    const normalizedEntity = normalizeEntity(
      entity,
      currentSummit.time_zone_id
    );

    if (emptyPurchaseSettings) {
      return postRequest(
        null,
        createAction(SPONSOR_PURCHASE_SETTINGS_UPDATED),
        `${window.PURCHASES_API_URL}/api/v1/shows-metadata/${currentSummit.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch);
    }

    return putRequest(
      null,
      createAction(SPONSOR_PURCHASE_SETTINGS_UPDATED),
      `${window.PURCHASES_API_URL}/api/v1/shows-metadata/${currentSummit.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch);
  };

export const getSponsorUsersMeta = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    createAction(REQUEST_SPONSOR_SETTINGS),
    createAction(RECEIVE_USER_SPONSOR_SETTINGS),
    `${window.SPONSOR_USERS_API_URL}/api/v1/shows-metadata/${currentSummit.id}`,
    (err, res) => customErrorHandler(err, res, SET_EMPTY_SPONSOR_USERS_SETTINGS)
  )(params)(dispatch)
    .catch(() => {})
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const saveSponsorUsersMeta = (entity) => async (dispatch, getState) => {
  const { currentSummitState, sponsorSettingsState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const { emptySponsorUserSettings } = sponsorSettingsState;

  const params = {
    access_token: accessToken
  };

  const normalizedEntity = normalizeEntity(entity, currentSummit.time_zone_id);

  if (emptySponsorUserSettings) {
    return postRequest(
      null,
      createAction(SPONSOR_USER_SETTINGS_UPDATED),
      `${window.SPONSOR_USERS_API_URL}/api/v1/shows-metadata/${currentSummit.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch);
  }

  return putRequest(
    null,
    createAction(SPONSOR_USER_SETTINGS_UPDATED),
    `${window.SPONSOR_USERS_API_URL}/api/v1/shows-metadata/${currentSummit.id}`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch);
};

export const saveAllSettings = (entity) => async (dispatch, getState) => {
  dispatch(startLoading());
  const userSettings = saveSponsorUsersMeta(entity)(dispatch, getState);
  const purchaseSettings = saveSponsorPurchasesMeta(entity)(dispatch, getState);

  Promise.all([purchaseSettings, userSettings]).finally(() => {
    dispatch(
      showSuccessMessage(T.translate("sponsor_settings.settings_saved"))
    );
  });
};

const normalizeEntity = (entity, summitTZ) => {
  const normalizedEntity = { ...entity };
  const {
    wire_transfer_notification_email,
    access_request_notification_email,
    early_bird_end_date,
    standard_price_end_date,
    onsite_price_start_date,
    onsite_price_end_date
  } = entity;

  normalizedEntity.wire_transfer_notification_email =
    wire_transfer_notification_email?.split(";") || [];
  normalizedEntity.access_request_notification_email =
    access_request_notification_email?.split(";") || [];
  normalizedEntity.early_bird_end_date = moment
    .tz(early_bird_end_date, summitTZ)
    .unix();
  normalizedEntity.standard_price_end_date = moment
    .tz(standard_price_end_date, summitTZ)
    .unix();
  normalizedEntity.onsite_price_start_date = moment
    .tz(onsite_price_start_date, summitTZ)
    .unix();
  normalizedEntity.onsite_price_end_date = moment
    .tz(onsite_price_end_date, summitTZ)
    .unix();

  return normalizedEntity;
};

const customErrorHandler = (err, res, action) => (dispatch, state) => {
  const code = err.status;
  dispatch(stopLoading());
  switch (code) {
    case ERROR_CODE_404:
      dispatch(createAction(action)({}));
      break;
    default:
      authErrorHandler(err, res)(dispatch, state);
  }
};
