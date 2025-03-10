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
  showMessage,
  showSuccessMessage,
  authErrorHandler,
  escapeFilterValue,
  getCSV
} from "openstack-uicore-foundation/lib/utils/actions";
import history from "../history";
import {
  checkOrFilter,
  getAccessTokenSafely,
  isNumericString,
  parseDateRangeFilter,
  range
} from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  FIVE_PER_PAGE
} from "../utils/constants";

export const REQUEST_ATTENDEES = "REQUEST_ATTENDEES";
export const RECEIVE_ATTENDEES = "RECEIVE_ATTENDEES";
export const RECEIVE_ATTENDEE = "RECEIVE_ATTENDEE";
export const RECEIVE_ATTENDEE_ORDERS = "RECEIVE_ATTENDEE_ORDERS";
export const CHANGE_MEMBER = "CHANGE_MEMBER";
export const RESET_ATTENDEE_FORM = "RESET_ATTENDEE_FORM";
export const UPDATE_ATTENDEE = "UPDATE_ATTENDEE";
export const ATTENDEE_UPDATED = "ATTENDEE_UPDATED";
export const ATTENDEE_ADDED = "ATTENDEE_ADDED";
export const ATTENDEE_DELETED = "ATTENDEE_DELETED";
export const TICKET_ADDED = "TICKET_ADDED";
export const TICKET_DELETED = "TICKET_DELETED";
export const RSVP_DELETED = "RSVP_DELETED";
export const SELECT_ATTENDEE = "SELECT_ATTENDEE";
export const UNSELECT_ATTENDEE = "UNSELECT_ATTENDEE";
export const CLEAR_ALL_SELECTED_ATTENDEES = "CLEAR_ALL_SELECTED_ATTENDEES";
export const SET_ATTENDEES_CURRENT_FLOW_EVENT =
  "SET_ATTENDEES_CURRENT_FLOW_EVENT";
export const SET_SELECTED_ALL_ATTENDEES = "SET_SELECTED_ALL_ATTENDEES";
export const SEND_ATTENDEES_EMAILS = "SEND_ATTENDEES_EMAILS";
export const RECEIVE_ALLOWED_EXTRA_QUESTIONS =
  "RECEIVE_ALLOWED_EXTRA_QUESTIONS";
export const CHANGE_ATTENDEE_SEARCH_TERM = "CHANGE_ATTENDEE_SEARCH_TERM";

export const selectAttendee = (attendeeId) => (dispatch) => {
  dispatch(createAction(SELECT_ATTENDEE)(attendeeId));
};

export const unSelectAttendee = (attendeeId) => (dispatch) => {
  dispatch(createAction(UNSELECT_ATTENDEE)(attendeeId));
};

export const clearAllSelectedAttendees = () => (dispatch) => {
  dispatch(createAction(CLEAR_ALL_SELECTED_ATTENDEES)());
};

export const setCurrentFlowEvent = (value) => (dispatch) => {
  dispatch(createAction(SET_ATTENDEES_CURRENT_FLOW_EVENT)(value));
};

export const setSelectedAll = (value) => (dispatch) => {
  dispatch(createAction(SET_SELECTED_ALL_ATTENDEES)(value));
};

const parseFilters = (filters, term = null) => {
  const filter = [];

  if (filters.tags?.length > 0) {
    filter.push(`tags_id==${filters.tags.map((t) => t.id).join("||")}`);
  }

  if (filters.statusFilter) {
    filter.push(`status==${filters.statusFilter}`);
  }

  if (filters.memberFilter) {
    if (filters.memberFilter === "HAS_MEMBER") filter.push("has_member==true");
    if (filters.memberFilter === "HAS_NO_MEMBER")
      filter.push("has_member==false");
  }

  if (filters.ticketsFilter) {
    if (filters.ticketsFilter === "HAS_TICKETS")
      filter.push("has_tickets==true");
    if (filters.ticketsFilter === "HAS_NO_TICKETS")
      filter.push("has_tickets==false");
  }

  if (filters.virtualCheckInFilter) {
    if (filters.virtualCheckInFilter === "HAS_VIRTUAL_CHECKIN")
      filter.push("has_virtual_checkin==true");
    if (filters.virtualCheckInFilter === "HAS_NO_VIRTUAL_CHECKIN")
      filter.push("has_virtual_checkin==false");
  }

  if (filters.checkedInFilter) {
    if (filters.checkedInFilter === "CHECKED_IN")
      filter.push("has_checkin==true");
    if (filters.checkedInFilter === "NO_CHECKED_IN")
      filter.push("has_checkin==false");
  }

  if (filters.hasNotesFilter) {
    if (filters.hasNotesFilter === "HAS_NOTES") filter.push("has_notes==true");
    if (filters.hasNotesFilter === "HAS_NO_NOTES")
      filter.push("has_notes==false");
  }

  if (filters.hasManagerFilter) {
    if (filters.hasManagerFilter === "HAS_MANAGER")
      filter.push("has_manager==true");
    if (filters.hasManagerFilter === "HAS_NO_MANAGER")
      filter.push("has_manager==false");
  }

  if (
    Array.isArray(filters.ticketTypeFilter) &&
    filters.ticketTypeFilter.length > 0
  ) {
    filter.push(`ticket_type_id==${filters.ticketTypeFilter.join("||")}`);
  }

  if (filters?.companyFilter?.length > 0) {
    const nonTBD = filters?.companyFilter.filter((cf) => cf.id !== "NULL");
    const companyFilter = [];

    // has tbd
    if (nonTBD.length < filters?.companyFilter?.length) {
      companyFilter.push("has_company==0");
    }

    if (nonTBD.length > 0) {
      companyFilter.push(
        `company==${nonTBD.map((cf) => encodeURIComponent(cf.name)).join("||")}`
      );
    }

    filter.push(companyFilter.join(","));
  }

  if (
    Array.isArray(filters.featuresFilter) &&
    filters.featuresFilter.length > 0
  ) {
    filter.push(`features_id==${filters.featuresFilter.join("||")}`);
  }

  if (
    Array.isArray(filters.badgeTypeFilter) &&
    filters.badgeTypeFilter.length > 0
  ) {
    filter.push(`badge_type_id==${filters.badgeTypeFilter.join("||")}`);
  }

  if (filters.checkinDateFilter) {
    parseDateRangeFilter(
      filter,
      filters.checkinDateFilter,
      "summit_hall_checked_in_date"
    );
  }

  if (filters.notes) {
    const escapedNotes = escapeFilterValue(filters.notes);
    filter.push(`notes@@${escapedNotes}`);
  }

  if (term) {
    const escapedTerm = escapeFilterValue(term);
    let searchString =
      `first_name=@${escapedTerm},` +
      `last_name=@${escapedTerm},` +
      `email=@${escapedTerm},` +
      `company=@${escapedTerm},` +
      `ticket_type=@${escapedTerm},` +
      `badge_type=@${escapedTerm},` +
      `full_name=@${escapedTerm},`;

    if (isNumericString(term)) {
      searchString += `,id==${term}`;
    }

    filter.push(searchString);
  }

  return checkOrFilter(filters, filter);
};

export const getAttendees =
  (
    term = null,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    filters = {},
    extraColumns = []
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const summitTZ = currentSummit.time_zone.name;
    dispatch(startLoading());

    const params = {
      expand: "tags,notes,manager",
      relations: "member,manager,tags,tickets,notes",
      fields:
        "id,email,first_name,last_name,company,status,summit_hall_checked_in_date",
      page,
      per_page: perPage,
      access_token: accessToken
    };

    const filter = parseFilters(filters, term);

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_ATTENDEES),
      createAction(RECEIVE_ATTENDEES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees`,
      authErrorHandler,
      { page, perPage, term, order, orderDir, filters, extraColumns, summitTZ }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const exportAttendees =
  (term = null, order = "id", orderDir = 1, filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filename = `${currentSummit.name}-Attendees.csv`;

    const params = {
      expand: "",
      access_token: accessToken
    };

    const filter = parseFilters(filters, term);

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
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/csv`,
        params,
        filename
      )
    );
  };

export const getAttendee = (attendeeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    expand:
      "member, speaker, tickets, rsvp, schedule_summit_events, all_affiliations, extra_questions, tickets.badge, tickets.badge.type, tickets.promo_code, tags, manager",
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_ATTENDEE),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}`,
    authErrorHandler
  )(params)(dispatch).then(({ response }) => getAttendeeOrders(response)(dispatch, getState));
};

export const getAttendeeOrders = (attendee) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    expand: "tickets",
    page: 1,
    per_page: 30,
    access_token: accessToken,
    "filter[]": [`owner_email==${attendee.email}`]
  };

  return getRequest(
    null,
    createAction(RECEIVE_ATTENDEE_ORDERS),
    `${window.API_BASE_URL}/api/v1/summits/${attendee.summit_id}/orders`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

/**
 *
 * @param attendeeId
 * @param tickets_exclude_inactives
 * @param perPage
 * @returns {function(*, *): Promise<*>}
 */
export const getAllowedExtraQuestions =
  (attendeeId, tickets_exclude_inactives = true, perPage = FIVE_PER_PAGE) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const two = 2;

    const params = {
      page: 1,
      per_page: perPage,
      expand: "*sub_question_rules,*sub_question,*values",
      access_token: accessToken,
      "filter[]": `tickets_exclude_inactives==${
        tickets_exclude_inactives ? "true" : "false"
      }`
    };

    const endpoint = `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/allowed-extra-questions`;

    dispatch(startLoading());

    return getRequest(
      createAction("DUMMY"),
      createAction("DUMMY"),
      endpoint,
      authErrorHandler
    )(params)(dispatch)
      .then((payload) => {
        const { response } = payload;
        const { total, per_page, data: initial_data } = response;
        // then do a promise all to get remaining ones
        const totalPages = Math.ceil(total / per_page);
        if (totalPages === 1) {
          // we have only one page ...
          dispatch(createAction(RECEIVE_ALLOWED_EXTRA_QUESTIONS)(initial_data));
          dispatch(stopLoading());
          return initial_data;
        }
        // only continue if totalPages > 1
        const params = range(two, totalPages, 1).map((i) => ({
          page: i,
          per_page,
          expand: "*sub_question_rules,*sub_question,*values",
          access_token: accessToken,
          "filter[]": `tickets_exclude_inactives==${
            tickets_exclude_inactives ? "true" : "false"
          }`
        }));

        // get remaining ones
        return Promise.all(
          params.map((p) =>
            getRequest(
              createAction("DUMMY"),
              createAction("DUMMY"),
              endpoint,
              authErrorHandler
            )(p)(dispatch)
          )
        )
          .then((responses) => {
            let data = [];
            responses?.forEach((e) => data.push(...e.response.data));
            data = [...initial_data, ...data];
            dispatch(createAction(RECEIVE_ALLOWED_EXTRA_QUESTIONS)(data));
            dispatch(stopLoading());
            return data;
          })
          .catch(() => {
            dispatch(stopLoading());
            return Promise.reject(e);
          });
      })
      .catch((e) => {
        dispatch(stopLoading());
        return Promise.reject(e);
      });
  };

export const resetAttendeeForm = () => (dispatch) => {
  dispatch(createAction(RESET_ATTENDEE_FORM)({}));
};

export const reassignTicket =
  (attendeeId, newMemberId, ticketId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_attendee.ticket_reassigned"),
      type: "success"
    };

    putRequest(
      null,
      createAction(CHANGE_MEMBER),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/tickets/${ticketId}/reassign/${newMemberId}`,
      {},
      authErrorHandler
    )(params)(dispatch).then((payload) => {
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${currentSummit.id}/attendees/${payload.response.owner_id}`
          );
        })
      );
    });
  };

export const saveAttendee = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);

  const params = {
    access_token: accessToken,
    expand:
      "member, speaker, tickets, rsvp, schedule_summit_events, all_affiliations, extra_questions, tickets.badge, tickets.badge.type, tickets.promo_code, tags, manager"
  };

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_ATTENDEE),
      createAction(ATTENDEE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(showSuccessMessage(T.translate("edit_attendee.attendee_saved")));
    });
  }
  const success_message = {
    title: T.translate("general.done"),
    html: T.translate("edit_attendee.attendee_created"),
    type: "success"
  };

  return postRequest(
    createAction(UPDATE_ATTENDEE),
    createAction(ATTENDEE_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch).then((payload) => {
    dispatch(
      showMessage(success_message, () => {
        history.push(
          `/app/summits/${currentSummit.id}/attendees/${payload.response.id}`
        );
      })
    );
  });
};

export const deleteAttendee = (attendeeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(ATTENDEE_DELETED)({ attendeeId }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const deleteTicket =
  (attendeeId, ticketId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(TICKET_DELETED)({ ticketId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/tickets/${ticketId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const saveTicket =
  (attendeeId, newTicket) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken,
      expand: "tickets"
    };

    postRequest(
      null,
      createAction(TICKET_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/tickets`,
      newTicket,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteRsvp = (memberId, rsvpId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(RSVP_DELETED)({ rsvpId }),
    `${window.API_BASE_URL}/api/v1/members/${memberId}/rsvp/${rsvpId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const sendEmails =
  (filters = {}, recipientEmail = null, excerptRecipient = null) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentAttendeeListState } = getState();
    const { term, currentFlowEvent, selectedAll, selectedIds, excludedIds } =
      currentAttendeeListState;
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    let filter = [];

    const params = {
      access_token: accessToken
    };

    if (!selectedAll && selectedIds.length > 0) {
      // we don't need the filter criteria, we have the ids
      filter.push(`id==${selectedIds.join("||")}`);
    } else {
      filter = parseFilters(filters, term);

      if (selectedAll && excludedIds.length > 0) {
        filter.push(`not_id==${excludedIds.join("||")}`);
      }
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    const payload = {
      email_flow_event: currentFlowEvent
    };

    if (recipientEmail) {
      payload.test_email_recipient = recipientEmail;
    }

    if (excerptRecipient) {
      payload.outcome_email_recipient = excerptRecipient;
    }

    dispatch(startLoading());

    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("registration_invitation_list.resend_done"),
      type: "success"
    };

    return putRequest(
      null,
      createAction(SEND_ATTENDEES_EMAILS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/all/send`,
      payload,
      authErrorHandler
    )(params)(dispatch).then((payload) => {
      dispatch(showMessage(success_message));
      dispatch(stopLoading());
      return payload;
    });
  };

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  normalizedEntity.member_id =
    normalizedEntity.member != null ? normalizedEntity.member.id : 0;

  normalizedEntity.manager_id = normalizedEntity.manager
    ? normalizedEntity.manager.id
    : 0;

  if (normalizedEntity.member_id) {
    delete normalizedEntity.email;
  }

  delete normalizedEntity.summit_hall_checked_in_date;
  delete normalizedEntity.member;
  delete normalizedEntity.manager;
  delete normalizedEntity.tickets;
  delete normalizedEntity.id;
  delete normalizedEntity.created;
  delete normalizedEntity.last_edited;
  delete normalizedEntity.allowed_extra_questions;

  if (!normalizedEntity.company_id) {
    delete normalizedEntity.company_id;
  }

  normalizedEntity.tags = entity.tags.map((t) => t.tag);

  return normalizedEntity;
};

export const changeAttendeeListSearchTerm = (term) => (dispatch) => {
  dispatch(createAction(CHANGE_ATTENDEE_SEARCH_TERM)({ term }));
};
