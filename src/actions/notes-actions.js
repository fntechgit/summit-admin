/**
 * Copyright 2022 OpenStack Foundation
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
  createAction,
  stopLoading,
  startLoading,
  snackbarErrorHandler,
  snackbarSuccessHandler,
  escapeFilterValue,
  deleteRequest,
  postRequest,
  getCSV
} from "openstack-uicore-foundation/lib/utils/actions";
import T from "i18n-react";
import { getAccessTokenSafely } from "../utils/methods";

export const CLEAR_NOTES_PARAMS = "CLEAR_NOTES_PARAMS";
export const REQUEST_NOTES = "REQUEST_NOTES";
export const RECEIVE_NOTES = "RECEIVE_NOTES";
export const NOTE_ADDED = "NOTE_ADDED";
export const NOTE_DELETED = "NOTE_DELETED";

export const getNotes =
  (attendeeId, ticketId, term = null, page, perPage, order, orderDir) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `author_email=@${escapedTerm},author_fullname=@${escapedTerm},content=@${escapedTerm}`
      );
    }

    if (ticketId) {
      filter.push(`ticket_id==${ticketId}`);
    }

    const params = {
      page,
      per_page: perPage,
      expand: "author,ticket",
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

    return getRequest(
      createAction(REQUEST_NOTES),
      createAction(RECEIVE_NOTES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/notes`,
      snackbarErrorHandler,
      { page, perPage, order, orderDir, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const exportNotes =
  (attendeeId, ticketId, term = null, order, orderDir) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];
    const filename = `${attendeeId}-notes.csv`;

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `author_email=@${escapedTerm},author_fullname=@${escapedTerm},content=@${escapedTerm}`
      );
    }

    if (ticketId) {
      filter.push(`ticket_id==${ticketId}`);
    }

    const params = {
      expand: "author,ticket",
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
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/notes/csv`,
        params,
        filename
      )
    );
  };

export const saveNote =
  (attendeeId, ticketId, content) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const note = { content };

    if (ticketId) note.ticket_id = ticketId;

    const params = {
      access_token: accessToken,
      expand: "author,ticket"
    };

    return postRequest(
      null,
      createAction(NOTE_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/notes`,
      note,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("notes.note_created")
          })
        );
      })
      .finally(() => dispatch(stopLoading()));
  };

export const deleteNote =
  (attendeeId, noteId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(NOTE_DELETED)({ noteId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/notes/${noteId}`,
      null,
      snackbarErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const clearNotesParams = () => async (dispatch) => {
  dispatch(createAction(CLEAR_NOTES_PARAMS)());
};
