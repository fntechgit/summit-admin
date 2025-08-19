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
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  putFile,
  createAction,
  stopLoading,
  startLoading,
  authErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";
import { DEFAULT_PER_PAGE } from "../utils/constants";

export const REQUEST_EVENT_RSVP = "REQUEST_EVENT_RSVP";
export const RECEIVE_EVENT_RSVP = "RECEIVE_EVENT_RSVP";

export const UPDATE_EVENT_RSVP = "UPDATE_EVENT_RSVP";
export const EVENT_RSVP_UPDATED = "EVENT_RSVP_UPDATED";
export const EVENT_RSVP_DELETED = "EVENT_RSVP_DELETED";

export const RECEIVE_EVENT_RSVP_INVITATION = "RECEIVE_EVENT_RSVP_INVITATION";
export const REQUEST_EVENT_RSVP_INVITATION = "REQUEST_EVENT_RSVP_INVITATION";
export const EVENT_RSVP_INVITATION_DELETED = "EVENT_RSVP_INVITATION_DELETED";
export const EVENT_RSVP_INVITATION_ADDED = "EVENT_RSVP_INVITATION_ADDED";
export const EVENT_RSVP_INVITATIONS_IMPORTED =
  "EVENT_RSVP_INVITATIONS_IMPORTED";

export const SELECT_EVENT_RSVP_INVITATION = "SELECT_EVENT_RSVP_INVITATION";
export const UNSELECT_EVENT_RSVP_INVITATION = "UNSELECT_EVENT_RSVP_INVITATION";
export const CLEAR_ALL_SELECTED_EVENT_RSVP_INVITATIONS =
  "CLEAR_ALL_SELECTED_EVENT_RSVP_INVITATIONS";
export const SET_CURRENT_FLOW_EVENT = "SET_CURRENT_FLOW_EVENT";
export const SET_SELECTED_ALL = "SET_SELECTED_ALL";

export const getEventRSVPS =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentSummitEventState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId }
    } = currentSummitEventState;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`first_name=@${escapedTerm},last_name=@${escapedTerm}`);
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "owner"
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_EVENT_RSVP),
      createAction(RECEIVE_EVENT_RSVP),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvps`,
      authErrorHandler,
      { page, perPage, order, orderDir, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const editEventRSVP = (entity) => async (dispatch, getState) => {
  const { currentSummitState, currentSummitEventState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const {
    entity: { id: eventId }
  } = currentSummitEventState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const normalizedEntity = normalizeEntity(entity);

  return putRequest(
    createAction(UPDATE_EVENT_RSVP),
    createAction(EVENT_RSVP_UPDATED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvps/${rsvpId}`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch).then(() => {
    dispatch(showSuccessMessage(T.translate("edit_attendee.attendee_saved")));
  });
};
export const deleteEventRSVP = (rsvpId) => async (dispatch, getState) => {
  const { currentSummitState, currentSummitEventState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const {
    entity: { id: eventId }
  } = currentSummitEventState;

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(EVENT_RSVP_DELETED)({ rsvpId }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvps/${rsvpId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  delete normalizedEntity.created;
  delete normalizedEntity.last_edited;

  return normalizedEntity;
};

export const getEventRSVPInvitations =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentSummitEventState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId }
    } = currentSummitEventState;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`first_name=@${escapedTerm},last_name=@${escapedTerm}`);
      filter.push(`email=@${escapedTerm}`);
      filter.push(`status=@${escapedTerm}`);
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "invitee"
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_EVENT_RSVP_INVITATION),
      createAction(RECEIVE_EVENT_RSVP_INVITATION),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvp-invitations`,
      authErrorHandler,
      { page, perPage, order, orderDir, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteEventRSVPInvitation =
  (invitationId) => async (dispatch, getState) => {
    const { currentSummitState, currentSummitEventState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId }
    } = currentSummitEventState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(EVENT_RSVP_INVITATION_DELETED)({ invitationId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvp-invitations/${invitationId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const selectInvitation = (invitationId) => (dispatch) => {
  dispatch(createAction(SELECT_EVENT_RSVP_INVITATION)(invitationId));
};

export const unSelectInvitation = (invitationId) => (dispatch) => {
  dispatch(createAction(UNSELECT_EVENT_RSVP_INVITATION)(invitationId));
};

export const clearAllSelectedInvitations = () => (dispatch) => {
  dispatch(createAction(CLEAR_ALL_SELECTED_EVENT_RSVP_INVITATIONS)());
};

export const setCurrentFlowEvent = (value) => (dispatch) => {
  dispatch(createAction(SET_CURRENT_FLOW_EVENT)(value));
};

export const setSelectedAll = (value) => (dispatch) => {
  dispatch(createAction(SET_SELECTED_ALL)(value));
};

export const importRSVPInvitationsCSV =
  (file) => async (dispatch, getState) => {
    const { currentSummitState, currentSummitEventState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId }
    } = currentSummitEventState;

    const params = {
      access_token: accessToken
    };

    putFile(
      null,
      createAction(EVENT_RSVP_INVITATIONS_IMPORTED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvp-invitations/csv`,
      file,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
      window.location.reload();
    });
  };

export const addEventRSVPInvitation =
  (invitee_id) => async (dispatch, getState) => {
    const { currentSummitState, currentSummitEventState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId }
    } = currentSummitEventState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand: "invitee"
    };

    postRequest(
      null,
      createAction(EVENT_RSVP_INVITATION_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvp-invitations`,
      { invitee_id },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const sendEventRSVPInvitation =
  (invitee_id) => async (dispatch, getState) => {
    const { currentSummitState, currentSummitEventState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId }
    } = currentSummitEventState;

    const params = {
      access_token: accessToken
    };

    postRequest(
      null,
      createAction(EVENT_RSVP_INVITATIONS_IMPORTED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvp-invitations`,
      { invitee_id },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
      window.location.reload();
    });
  };
