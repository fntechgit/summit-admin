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

import T from "i18n-react/dist/i18n-react";
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";
import { getAccessTokenSafely } from "../utils/methods";
import { DEFAULT_PER_PAGE } from "../utils/constants";

export const REQUEST_ADD_ON_TYPES = "REQUEST_ADD_ON_TYPES";
export const RECEIVE_ADD_ON_TYPES = "RECEIVE_ADD_ON_TYPES";
export const RECEIVE_ADD_ON_TYPE = "RECEIVE_ADD_ON_TYPE";
export const RESET_ADD_ON_TYPE_FORM = "RESET_ADD_ON_TYPE_FORM";
export const UPDATE_ADD_ON_TYPE = "UPDATE_ADD_ON_TYPE";
export const ADD_ON_TYPE_UPDATED = "ADD_ON_TYPE_UPDATED";
export const ADD_ON_TYPE_ADDED = "ADD_ON_TYPE_ADDED";
export const ADD_ON_TYPE_DELETED = "ADD_ON_TYPE_DELETED";

export const getAddOnTypes =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "order",
    orderDir = 1
  ) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const filter = [];

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
    };

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm}`);
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_ADD_ON_TYPES),
      createAction(RECEIVE_ADD_ON_TYPES),
      `${window.API_BASE_URL}/api/v1/summits/all/add-on-types`,
      snackbarErrorHandler,
      { order, orderDir, perPage, page, term }
    )(params)(dispatch).finally(() => {
      dispatch(stopLoading());
    });
  };

export const getAddOnType = (addOnTypeId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_ADD_ON_TYPE),
    `${window.API_BASE_URL}/api/v1/summits/all/add-on-types/${addOnTypeId}`,
    snackbarErrorHandler
  )(params)(dispatch).finally(() => {
    dispatch(stopLoading());
  });
};

export const saveAddOnType = (entity) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const normalizedEntity = normalizeEntity(entity);

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_ADD_ON_TYPE),
      createAction(ADD_ON_TYPE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/all/add-on-types/${entity.id}`,
      normalizedEntity,
      snackbarErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("add_on_types_list.add_on_type_saved")
          })
        );
      })
      .finally(() => dispatch(stopLoading()));
  }

  return postRequest(
    createAction(UPDATE_ADD_ON_TYPE),
    createAction(ADD_ON_TYPE_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/all/add-on-types`,
    normalizedEntity,
    snackbarErrorHandler,
    entity
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("add_on_types_list.add_on_type_created")
        })
      );
    })
    .finally(() => dispatch(stopLoading()));
};

export const deleteAddOnType = (addOnTypeId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(ADD_ON_TYPE_DELETED)({ addOnTypeId }),
    `${window.API_BASE_URL}/api/v1/summits/all/add-on-types/${addOnTypeId}`,
    null,
    snackbarErrorHandler
  )(params)(dispatch).finally(() => {
    dispatch(stopLoading());
  });
};

export const resetAddOnTypeForm = () => (dispatch) => {
  dispatch(createAction(RESET_ADD_ON_TYPE_FORM)({}));
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  delete normalizedEntity.created;
  delete normalizedEntity.last_edited;

  return normalizedEntity;
};
