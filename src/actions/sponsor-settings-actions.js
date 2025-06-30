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
  putRequest,
  startLoading,
  stopLoading,
  showSuccessMessage
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";

export const REQUEST_SPONSOR_SETTINGS = "REQUEST_SPONSOR_SETTINGS";
export const RECEIVE_SPONSOR_SETTINGS = "RECEIVE_SPONSOR_SETTINGS";
export const SPONSOR_SETTINGS_UPDATED = "SPONSOR_SETTINGS_UPDATED";

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
    createAction(RECEIVE_SPONSOR_SETTINGS),
    `${window.PURCHASES_API_URL}/api/v1/shows/${currentSummit.id}/metadata`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};


export const saveSponsorPurchasesMeta = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const normalizedEntity = normalizeEntity(entity);

  putRequest(
    null,
    createAction(SPONSOR_SETTINGS_UPDATED),
    `${window.PURCHASES_API_URL}/api/v1/shows/${currentSummit.id}/metadata`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch).then(() => {
    dispatch(showSuccessMessage(T.translate("sponsor_settings.settings_saved")));
  });
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
    createAction(RECEIVE_SPONSOR_SETTINGS),
    `${window.SPONSOR_USERS_API_URL}/api/v1/shows-metadata/${currentSummit.id}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};


export const saveSponsorUsersMeta = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const normalizedEntity = normalizeEntity(entity);

  putRequest(
    null,
    createAction(SPONSOR_SETTINGS_UPDATED),
    `${window.SPONSOR_USERS_API_URL}/api/v1/shows-metadata/${currentSummit.id}`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch).then(() => {
    dispatch(showSuccessMessage(T.translate("sponsor_settings.settings_saved")));
  });
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  // remove # from color hexa
  normalizedEntity.color = normalizedEntity.color.substr(1);

  delete normalizedEntity.logo;
  delete normalizedEntity.big_logo;

  return normalizedEntity;
};