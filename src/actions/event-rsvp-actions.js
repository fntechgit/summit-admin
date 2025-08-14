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

export const EVENT_RSVP_ADDED = "EVENT_RSVP_ADDED";
export const EVENT_RSVP_UPDATED = "EVENT_RSVP_UPDATED";
export const EVENT_RSVP_DELETED = "EVENT_RSVP_DELETED";

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
      filter.push(`name=@${escapedTerm}`);
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
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
