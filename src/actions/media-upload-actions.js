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
import T from "i18n-react/dist/i18n-react";
import URI from "urijs";
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  showMessage,
  showSuccessMessage,
  authErrorHandler,
  escapeFilterValue,
  fetchResponseHandler,
  fetchErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import history from "../history";
import { getAccessTokenSafely } from "../utils/methods";
import { DEBOUNCE_WAIT, DEFAULT_PER_PAGE } from "../utils/constants";

export const REQUEST_MEDIA_UPLOADS = "REQUEST_MEDIA_UPLOADS";
export const RECEIVE_MEDIA_UPLOADS = "RECEIVE_MEDIA_UPLOADS";
export const RECEIVE_MEDIA_UPLOAD = "RECEIVE_MEDIA_UPLOAD";
export const RESET_MEDIA_UPLOAD_FORM = "RESET_MEDIA_UPLOAD_FORM";
export const UPDATE_MEDIA_UPLOAD = "UPDATE_MEDIA_UPLOAD";
export const MEDIA_UPLOAD_UPDATED = "MEDIA_UPLOAD_UPDATED";
export const MEDIA_UPLOAD_ADDED = "MEDIA_UPLOAD_ADDED";
export const MEDIA_UPLOAD_DELETED = "MEDIA_UPLOAD_DELETED";
export const MEDIA_UPLOADS_COPIED = "MEDIA_UPLOADS_COPIED";
export const MEDIA_UPLOAD_LINKED = "MEDIA_UPLOAD_LINKED";
export const MEDIA_UPLOAD_UNLINKED = "MEDIA_UPLOAD_UNLINKED";

export const getMediaUploads =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      page,
      per_page: perPage,
      fields: "id,name,description",
      relations: "none"
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
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_MEDIA_UPLOADS),
      createAction(RECEIVE_MEDIA_UPLOADS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/media-upload-types`,
      authErrorHandler,
      { order, orderDir, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getMediaUpload = (mediaUploadId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_MEDIA_UPLOAD),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/media-upload-types/${mediaUploadId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const queryMediaUploads = _.debounce(
  async (summitId, input, callback) => {
    const accessToken = await getAccessTokenSafely();
    const apiUrl = URI(
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/media-upload-types`
    );

    apiUrl.addQuery("access_token", accessToken);
    apiUrl.addQuery("order", "name");
    apiUrl.addQuery("expand", "type");
    apiUrl.addQuery("per_page", DEFAULT_PER_PAGE);

    if (input) {
      input = escapeFilterValue(input);
      apiUrl.addQuery("filter[]", `name=@${input}`);
    }

    fetch(apiUrl.toString())
      .then(fetchResponseHandler)
      .then((json) => {
        const options = [...json.data];
        callback(options);
      })
      .catch(fetchErrorHandler);
  },
  DEBOUNCE_WAIT
);

export const resetMediaUploadForm = () => (dispatch) => {
  dispatch(createAction(RESET_MEDIA_UPLOAD_FORM)({}));
};

export const saveMediaUpload =
  (entity, noAlert = false) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const normalizedEntity = normalizeEntity(entity);
    const params = { access_token: accessToken };

    if (entity.id) {
      putRequest(
        createAction(UPDATE_MEDIA_UPLOAD),
        createAction(MEDIA_UPLOAD_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/media-upload-types/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        if (!noAlert)
          dispatch(showSuccessMessage(T.translate("media_upload.saved")));
        else dispatch(stopLoading());
      });
    } else {
      const successMessage = {
        title: T.translate("general.done"),
        html: T.translate("media_upload.created"),
        type: "success"
      };

      postRequest(
        createAction(UPDATE_MEDIA_UPLOAD),
        createAction(MEDIA_UPLOAD_ADDED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/media-upload-types`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then((payload) => {
        dispatch(
          showMessage(successMessage, () => {
            history.push(
              `/app/summits/${currentSummit.id}/media-uploads/${payload.response.id}`
            );
          })
        );
      });
    }
  };

export const linkToPresentationType =
  (mediaUpload, presentationTypeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = { access_token: accessToken };

    dispatch(startLoading());

    putRequest(
      null,
      createAction(MEDIA_UPLOAD_LINKED)({ mediaUpload }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/media-upload-types/${mediaUpload.id}/presentation-types/${presentationTypeId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const unlinkFromPresentationType =
  (mediaUploadId, presentationTypeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = { access_token: accessToken };

    dispatch(startLoading());

    deleteRequest(
      null,
      createAction(MEDIA_UPLOAD_UNLINKED)({ mediaUploadId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/media-upload-types/${mediaUploadId}/presentation-types/${presentationTypeId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteMediaUpload =
  (mediaUploadId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(MEDIA_UPLOAD_DELETED)({ mediaUploadId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/media-upload-types/${mediaUploadId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const copyMediaUploads = (summitId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = { access_token: accessToken };

  postRequest(
    null,
    createAction(MEDIA_UPLOADS_COPIED),
    `${window.API_BASE_URL}/api/v1/summits/${summitId}/media-upload-types/all/clone/${currentSummit.id}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(getMediaUploads());
  });
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  delete normalizedEntity.id;
  delete normalizedEntity.created;
  delete normalizedEntity.modified;

  if (normalizedEntity?.temporary_links_public_storage_ttl === "") {
    normalizedEntity.temporary_links_public_storage_ttl = 0;
  }

  if (normalizedEntity?.min_uploads_qty > 0) {
    normalizedEntity.is_mandatory = true;
  }

  return normalizedEntity;
};
