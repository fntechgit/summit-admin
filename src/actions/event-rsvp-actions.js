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
  postFile,
  getCSV,
  createAction,
  stopLoading,
  startLoading,
  authErrorHandler,
  showMessage,
  showSuccessMessage,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";
import { DEFAULT_PER_PAGE, RSVP_STATUS } from "../utils/constants";

export const REQUEST_EVENT_RSVP = "REQUEST_EVENT_RSVP";
export const RECEIVE_EVENT_RSVP = "RECEIVE_EVENT_RSVP";

export const UPDATE_EVENT_RSVP = "UPDATE_EVENT_RSVP";
export const EVENT_RSVP_ADDED = "EVENT_RSVP_ADDED";
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
export const SET_CURRENT_EMAIL_TEMPLATE = "SET_CURRENT_EMAIL_TEMPLATE";
export const SET_SELECTED_ALL = "SET_SELECTED_ALL";
export const SEND_EVENT_RSVP_INVITATIONS_EMAILS =
  "SEND_EVENT_RSVP_INVITATIONS_EMAILS";

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
      filter.push(
        `owner_full_name=@${escapedTerm},owner_email=@${escapedTerm}`
      );
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

    if (filter.length > 0) {
      params["filter[]"] = filter;
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

export const addEventRSVP = (entity) => async (dispatch, getState) => {
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

  return postRequest(
    createAction(UPDATE_EVENT_RSVP),
    createAction(EVENT_RSVP_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvps`,
    entity,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(
      showSuccessMessage(T.translate("event_rsvp_list.rsvp_added"), () =>
        dispatch(getEventRSVPS())
      )
    );
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

export const exportEventRsvpsCSV =
  (term, order, orderDir) => async (dispatch, getState) => {
    const { currentSummitState, currentSummitEventState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId, title: eventName }
    } = currentSummitEventState;
    const filename = `${eventName}-rsvps.csv`;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `owner_full_name=@${escapedTerm},owner_email=@${escapedTerm}`
      );
    }

    const params = {
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    dispatch(
      getCSV(
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvps/csv`,
        params,
        filename
      )
    );
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

      const matchedStatus = RSVP_STATUS.find(
        (status) => status.toLowerCase() === term.toLowerCase()
      );

      if (matchedStatus) {
        filter.push(`status==${matchedStatus}`);
      } else {
        filter.push(
          `attendee_full_name=@${escapedTerm},attendee_email=@${escapedTerm}`
        );
      }
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "invitee",
      fields: "id,is_sent,status,invitee.first_name,invitee.last_name",
      relations: "invitee.none"
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
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

export const setCurrentEmailTemplate = (value) => (dispatch) => {
  dispatch(createAction(SET_CURRENT_EMAIL_TEMPLATE)(value));
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

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    postFile(
      null,
      createAction(EVENT_RSVP_INVITATIONS_IMPORTED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvp-invitations/csv`,
      file,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(getEventRSVPInvitations());
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
  (testRecipient = null, excerptRecipient = null, term = null) =>
  async (dispatch, getState) => {
    const {
      currentSummitState,
      currentSummitEventState,
      currentEventRsvpInvitationListState
    } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId }
    } = currentSummitEventState;
    const {
      excludedInvitationsIds,
      selectedInvitationsIds,
      currentEmailTemplate,
      selectedAll
    } = currentEventRsvpInvitationListState;
    const filter = [];

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    const payload = {
      email_flow_event: currentEmailTemplate
    };

    if (!selectedAll && selectedInvitationsIds.length > 0) {
      filter.push(`id==${selectedInvitationsIds.join("||")}`);
    } else {
      if (term) {
        const escapedTerm = escapeFilterValue(term);
        const matchedStatus = RSVP_STATUS.find(
          (status) => status.toLowerCase() === term.toLowerCase()
        );
        if (matchedStatus) {
          filter.push(`status==${matchedStatus}`);
        } else {
          filter.push(
            `attendee_full_name=@${escapedTerm},attendee_email=@${escapedTerm}`
          );
        }
      }

      if (selectedAll && excludedInvitationsIds.length > 0) {
        filter.push(`not_id==${excludedInvitationsIds.join("||")}`);
      }
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    if (testRecipient) {
      payload.test_email_recipient = testRecipient;
    }

    if (excerptRecipient) {
      payload.outcome_email_recipient = excerptRecipient;
    }

    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("event_rsvp_list.send_rsvp_invitations_done"),
      type: "success"
    };

    return putRequest(
      null,
      createAction(SEND_EVENT_RSVP_INVITATIONS_EMAILS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvp-invitations/send`,
      payload,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
      dispatch(showMessage(success_message));
    });
  };

export const exportEventRsvpInvitationCSV =
  (term, order, orderDir) => async (dispatch, getState) => {
    const { currentSummitState, currentSummitEventState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: eventId, title: eventName }
    } = currentSummitEventState;
    const filename = `${eventName}-rsvps-invitation.csv`;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);

      const matchedStatus = RSVP_STATUS.find(
        (status) => status.toLowerCase() === term.toLowerCase()
      );

      if (matchedStatus) {
        filter.push(`status==${matchedStatus}`);
      } else {
        filter.push(
          `attendee_full_name=@${escapedTerm},attendee_email=@${escapedTerm}`
        );
      }
    }

    const params = {
      access_token: accessToken,
      expand: "invitee"
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    dispatch(
      getCSV(
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/rsvp-invitations/csv`,
        params,
        filename
      )
    );
  };
