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
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  snackbarErrorHandler,
  escapeFilterValue,
  snackbarSuccessHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";
import { DEFAULT_PER_PAGE, DEFAULT_CURRENT_PAGE } from "../utils/constants";

export const REQUEST_EVENT_TYPES = "REQUEST_EVENT_TYPES";
export const RECEIVE_EVENT_TYPES = "RECEIVE_EVENT_TYPES";
export const RECEIVE_EVENT_TYPE = "RECEIVE_EVENT_TYPE";
export const RESET_EVENT_TYPE_FORM = "RESET_EVENT_TYPE_FORM";
export const UPDATE_EVENT_TYPE = "UPDATE_EVENT_TYPE";
export const EVENT_TYPE_UPDATED = "EVENT_TYPE_UPDATED";
export const EVENT_TYPE_ADDED = "EVENT_TYPE_ADDED";
export const EVENT_TYPE_DELETED = "EVENT_TYPE_DELETED";
export const EVENT_TYPES_SEEDED = "EVENT_TYPES_SEEDED";

export const getEventTypes =
  (
    term = null,
    page = DEFAULT_CURRENT_PAGE,
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
      per_page: perPage
    };

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm}`);
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_EVENT_TYPES),
      createAction(RECEIVE_EVENT_TYPES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/event-types`,
      snackbarErrorHandler,
      { order, orderDir, term, perPage }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getEventType = (eventTypeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    expand:
      "allowed_media_upload_types, allowed_media_upload_types.type, allowed_ticket_types",
    fields: "allowed_ticket_types.id,allowed_ticket_types.name",
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_EVENT_TYPE),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/event-types/${eventTypeId}`,
    snackbarErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetEventTypeForm = () => (dispatch) => {
  dispatch(createAction(RESET_EVENT_TYPE_FORM)({}));
};

export const saveEventType = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);
  const params = { access_token: accessToken };

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_EVENT_TYPE),
      createAction(EVENT_TYPE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/event-types/${entity.id}`,
      normalizedEntity,
      snackbarErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("edit_event_type.event_type_saved")
        })
      );
      dispatch(stopLoading());
    });
  }

  return postRequest(
    createAction(UPDATE_EVENT_TYPE),
    createAction(EVENT_TYPE_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/event-types`,
    normalizedEntity,
    snackbarErrorHandler,
    entity
  )(params)(dispatch).then(() => {
    dispatch(
      snackbarSuccessHandler({
        title: T.translate("general.success"),
        html: T.translate("edit_event_type.event_type_created")
      })
    );
    dispatch(stopLoading());
  });
};

export const deleteEventType = (eventTypeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(EVENT_TYPE_DELETED)({ eventTypeId }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/event-types/${eventTypeId}`,
    null,
    snackbarErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const seedEventTypes = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  return postRequest(
    null,
    createAction(EVENT_TYPES_SEEDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/event-types/seed-defaults`,
    null,
    snackbarErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(
      snackbarSuccessHandler({
        title: T.translate("general.success"),
        html: T.translate("edit_event_type.event_types_seed")
      })
    );
  });
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  // remove # from color hexa
  normalizedEntity.color = normalizedEntity.color.substr(1);

  delete normalizedEntity.id;
  delete normalizedEntity.created;
  delete normalizedEntity.last_edited;
  delete normalizedEntity.is_default;

  if (normalizedEntity.class_name === "EVENT_TYPE") {
    delete normalizedEntity.should_be_available_on_cfp;
    delete normalizedEntity.use_speakers;
    delete normalizedEntity.are_speakers_mandatory;
    delete normalizedEntity.min_speakers;
    delete normalizedEntity.max_speakers;
    delete normalizedEntity.use_moderator;
    delete normalizedEntity.is_moderator_mandatory;
    delete normalizedEntity.min_moderators;
    delete normalizedEntity.max_moderators;
    delete normalizedEntity.moderator_label;
    delete normalizedEntity.min_duration;
    delete normalizedEntity.max_duration;
  }

  if (normalizedEntity.show_always_on_schedule) {
    normalizedEntity.allowed_ticket_types = [];
  }

  if (normalizedEntity.allowed_ticket_types.length > 0) {
    normalizedEntity.allowed_ticket_types = entity.allowed_ticket_types.map(
      (tt) => (tt.hasOwnProperty("id") ? tt.id : tt)
    );
  }

  return normalizedEntity;
};
