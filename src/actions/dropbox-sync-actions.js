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
import pLimit from "p-limit";
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
import { getAccessTokenSafely, range } from "../utils/methods";
import { MAX_PER_PAGE, TEN, TWO } from "../utils/constants";

export const REQUEST_SYNC_CONFIG = "REQUEST_SYNC_CONFIG";
export const RECEIVE_SYNC_CONFIG = "RECEIVE_SYNC_CONFIG";
export const SYNC_CONFIG_UPDATED = "SYNC_CONFIG_UPDATED";
export const REBUILD_SYNC_DISPATCHED = "REBUILD_SYNC_DISPATCHED";
export const RESYNC_ROOM_DISPATCHED = "RESYNC_ROOM_DISPATCHED";

export const REQUEST_ALLOWLIST_OPTIONS = "REQUEST_ALLOWLIST_OPTIONS";
export const RECEIVE_ALLOWLIST_OPTIONS = "RECEIVE_ALLOWLIST_OPTIONS";
export const ALLOWLIST_OPTIONS_ERROR = "ALLOWLIST_OPTIONS_ERROR";

const getBaseUrl = () => window.DROPBOX_MATERIALIZER_API_BASE_URL;

// TWO-TIER sequence guard:
//   isNewest()     — seq only. Gates loading side effects (our stopLoading and
//                    the dispatch handed to getRequest so authErrorHandler's
//                    unconditional stopLoading is also suppressed). Seq-only
//                    preserves the newest-clears invariant: when the summit
//                    switches but NO newer fetch starts, isNewest=true lets the
//                    stale invocation's stopLoading clear the overlay.
//   stillCurrent() — seq + summit id. Gates state commits (REQUEST/RECEIVE/ERROR):
//                    a stale landing must not repopulate the slice that
//                    SET_CURRENT_SUMMIT just reset.
// Fan-out pages re-check stillCurrent() inside the pLimit callback: a superseded
// invocation's queued identical-key requests would abort the fresh invocation's
// in-flight pages (getRequest cancels by URL+params, stripping only access_token).
let allowlistOptionsSeq = 0;

export const getAllMediaUploadTypesForAllowlist =
  () => async (dispatch, getState) => {
    const summitId = getState().currentSummitState?.currentSummit?.id;
    // currentSummit defaults to a truthy {id: 0} entity — guard the id, not
    // the object (sibling precedent: getSyncConfig). Promise.resolve() so
    // every branch returns a thenable.
    if (!summitId) return Promise.resolve();

    allowlistOptionsSeq += 1;
    const mySeq = allowlistOptionsSeq;
    const isNewest = () => mySeq === allowlistOptionsSeq;
    const stillCurrent = () =>
      isNewest() &&
      getState().currentSummitState?.currentSummit?.id === summitId;
    // Loading-tier dispatch: passed to getRequest so its internal error handler
    // (authErrorHandler → stopLoading) fires only while this invocation is newest.
    const loadingDispatch = (action) => {
      if (isNewest()) dispatch(action);
    };
    // Commit-tier dispatch: state-bearing actions only.
    const commitDispatch = (action) => {
      if (stillCurrent()) dispatch(action);
    };

    dispatch(startLoading()); // newest by construction at entry
    commitDispatch(createAction(REQUEST_ALLOWLIST_OPTIONS)({}));

    const accessToken = await getAccessTokenSafely();
    // Superseded (or summit switched) while awaiting the token → fire nothing:
    // an identical-key request from this stale invocation would abort the
    // fresh invocation's page 1.
    if (!stillCurrent()) {
      if (isNewest()) dispatch(stopLoading());
      return Promise.resolve();
    }

    const endpoint = `${window.API_BASE_URL}/api/v1/summits/${summitId}/media-upload-types`;
    const baseParams = {
      access_token: accessToken,
      per_page: MAX_PER_PAGE,
      fields: "id,name,private_storage_type"
    };
    const limit = pLimit(TEN);
    const EMPTY_PAGE = { response: { data: [] } };

    return getRequest(
      createAction("DUMMY"),
      createAction("DUMMY"),
      endpoint,
      authErrorHandler
    )({ ...baseParams, page: 1 })(loadingDispatch)
      .then(({ response }) => {
        const { last_page: lastPage, data: firstPageData } = response;
        if (lastPage <= 1) {
          commitDispatch(
            createAction(RECEIVE_ALLOWLIST_OPTIONS)(firstPageData)
          );
          return firstPageData;
        }
        // local range() is stop-INCLUSIVE: range(TWO, lastPage, 1) === [2..lastPage]
        const pageParams = range(TWO, lastPage, 1).map((page) => ({
          ...baseParams,
          page
        }));
        return Promise.all(
          pageParams.map((p) =>
            limit(() =>
              // Re-check INSIDE the pool callback: a superseded invocation's
              // still-queued jobs must not fire (identical-key abort hazard).
              stillCurrent()
                ? getRequest(
                    createAction("DUMMY"),
                    createAction("DUMMY"),
                    endpoint,
                    authErrorHandler
                  )(p)(loadingDispatch)
                : Promise.resolve(EMPTY_PAGE)
            )
          )
        ).then((responses) => {
          // Promise.all preserves input order → page-order accumulation.
          const accumulated = [...firstPageData];
          responses.forEach(({ response: pageResponse }) => {
            accumulated.push(...pageResponse.data);
          });
          commitDispatch(createAction(RECEIVE_ALLOWLIST_OPTIONS)(accumulated));
          return accumulated;
        });
      })
      .catch((err) => {
        commitDispatch(
          createAction(ALLOWLIST_OPTIONS_ERROR)(
            err && err.message ? err.message : "fetch failed"
          )
        );
      })
      .finally(() => {
        loadingDispatch(stopLoading());
      });
  };

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
