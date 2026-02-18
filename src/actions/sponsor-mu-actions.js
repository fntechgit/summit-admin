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
  putRequest,
  deleteRequest,
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
export const REQUEST_GENERAL_MEDIA_UPLOADS = "REQUEST_GENERAL_MEDIA_UPLOADS";
export const RECEIVE_GENERAL_MEDIA_UPLOADS = "RECEIVE_GENERAL_MEDIA_UPLOADS";
export const SPONSOR_MEDIA_UPLOAD_FILE_UPLOADED =
  "SPONSOR_MEDIA_UPLOAD_FILE_UPLOADED";
export const SPONSOR_MEDIA_UPLOAD_FILE_DELETED =
  "SPONSOR_MEDIA_UPLOAD_FILE_DELETED";

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
      // fields: "id,name,max_file_size,media_upload,file_type",
      // relations: "media_upload,file_type",
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

export const getGeneralMURequests =
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
      // fields: "id,name,max_file_size,media_upload,file_type",
      expand: "media_upload,file_type",
      per_page: perPage,
      access_token: accessToken
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_GENERAL_MEDIA_UPLOADS),
      createAction(RECEIVE_GENERAL_MEDIA_UPLOADS),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/managed-media-request-modules`,
      snackbarErrorHandler,
      { order, orderDir, currentPage, perPage, summitTZ }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const uploadFileForSponsorMU =
  (pageId, moduleId, fileObj) => async (dispatch, getState) => {
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
      createAction("DUMMY_ACTION"),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/available-pages/${pageId}/modules/${moduleId}/file`,
      fileObj,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(({ response }) => {
        dispatch(
          createAction(SPONSOR_MEDIA_UPLOAD_FILE_UPLOADED)({
            ...response,
            moduleId
          })
        );
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const removeFileForSponsorMU =
  (pageId, moduleId) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const { entity: sponsor } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(SPONSOR_MEDIA_UPLOAD_FILE_DELETED)({ moduleId }),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsor.id}/available-pages/${pageId}/modules/${moduleId}/file`,
      null,
      snackbarErrorHandler
    )(params)(dispatch).finally(() => {
      dispatch(stopLoading());
    });
  };
