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
  createAction,
  stopLoading,
  startLoading,
  showSuccessMessage,
  authErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";

export const REQUEST_SYNC_CONFIG = "REQUEST_SYNC_CONFIG";
export const RECEIVE_SYNC_CONFIG = "RECEIVE_SYNC_CONFIG";
export const SYNC_CONFIG_UPDATED = "SYNC_CONFIG_UPDATED";
export const REBUILD_SYNC_DISPATCHED = "REBUILD_SYNC_DISPATCHED";
export const RESYNC_ROOM_DISPATCHED = "RESYNC_ROOM_DISPATCHED";

const getBaseUrl = () => window.DROPBOX_MATERIALIZER_API_BASE_URL;

export const getSyncConfig = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const baseUrl = getBaseUrl();
  const summitId = currentSummitState?.currentSummit?.id;

  if (!baseUrl || !summitId) return;

  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  return getRequest(
    createAction(REQUEST_SYNC_CONFIG),
    createAction(RECEIVE_SYNC_CONFIG),
    `${baseUrl}/api/v1/sync/config/${summitId}/`,
    authErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(stopLoading());
    })
    .catch(() => {
      dispatch(createAction(RECEIVE_SYNC_CONFIG)({}));
    });
};

export const updateSyncConfig = (data) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const baseUrl = getBaseUrl();
  const summitId = currentSummitState?.currentSummit?.id;

  if (!baseUrl || !summitId) return;

  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return putRequest(
    null,
    createAction(SYNC_CONFIG_UPDATED),
    `${baseUrl}/api/v1/sync/config/${summitId}/`,
    data,
    authErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(stopLoading());
      dispatch(showSuccessMessage(T.translate("dropbox_sync.config_saved")));
    })
    .catch(() => {
      dispatch(stopLoading());
    });
};

export const rebuildSync = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const baseUrl = getBaseUrl();
  const summitId = currentSummitState?.currentSummit?.id;

  if (!baseUrl || !summitId) return;

  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return postRequest(
    null,
    createAction(REBUILD_SYNC_DISPATCHED),
    `${baseUrl}/api/v1/sync/rebuild/${summitId}/`,
    null,
    authErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(stopLoading());
      dispatch(
        showSuccessMessage(T.translate("dropbox_sync.rebuild_dispatched"))
      );
    })
    .catch(() => {
      dispatch(stopLoading());
    });
};

export const resyncRoom =
  (venueName, roomName) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const baseUrl = getBaseUrl();
    const summitId = currentSummitState?.currentSummit?.id;

    if (!baseUrl || !summitId) return;

    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return postRequest(
      null,
      createAction(RESYNC_ROOM_DISPATCHED),
      `${baseUrl}/api/v1/sync/materialize/${summitId}/${encodeURIComponent(
        venueName
      )}/${encodeURIComponent(roomName)}/`,
      null,
      authErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(stopLoading());
        dispatch(
          showSuccessMessage(T.translate("dropbox_sync.resync_dispatched"))
        );
      })
      .catch(() => {
        dispatch(stopLoading());
      });
  };
