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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";

import {
  RECEIVE_EVENT_RSVP_INVITATION,
  REQUEST_EVENT_RSVP_INVITATION,
  SELECT_EVENT_RSVP_INVITATION,
  UNSELECT_EVENT_RSVP_INVITATION,
  CLEAR_ALL_SELECTED_EVENT_RSVP_INVITATIONS,
  SET_CURRENT_EMAIL_TEMPLATE,
  SET_SELECTED_ALL,
  EVENT_RSVP_INVITATION_DELETED,
  EVENT_RSVP_INVITATION_ADDED,
  SEND_EVENT_RSVP_INVITATIONS_EMAILS
} from "../../actions/event-rsvp-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  eventRsvpInvitations: [],
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalEventRsvpInvitations: 0,
  selectedCount: 0,
  excludedInvitationsIds: [],
  selectedInvitationsIds: [],
  currentEmailTemplate: "",
  selectedAll: false
};

const eventRSVPInvitationListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EVENT_RSVP_INVITATION: {
      const { order, orderDir, term } = payload;

      return { ...state, order, orderDir, term };
    }
    case RECEIVE_EVENT_RSVP_INVITATION: {
      const { current_page, total, last_page, data } = payload.response;

      const eventRsvpInvitations = data.map((r) => ({
        attendee_full_name: `${r.invitee?.first_name} ${r.invitee?.last_name}`,
        ...r
      }));

      return {
        ...state,
        eventRsvpInvitations,
        currentPage: current_page,
        totalEventRsvpInvitations: total,
        lastPage: last_page
      };
    }
    case EVENT_RSVP_INVITATION_DELETED: {
      const { invitationId } = payload;

      const eventRsvpInvitations = state.eventRsvpInvitations.filter(
        (r) => r.id !== invitationId
      );

      return {
        ...state,
        eventRsvpInvitations,
        totalEventRsvpInvitations: state.totalEventRsvpInvitations - 1
      };
    }
    case EVENT_RSVP_INVITATION_ADDED: {
      const invitation = payload.response;
      invitation.attendee_full_name = `${invitation.invitee?.first_name} ${invitation.invitee?.last_name}`;
      const eventRsvpInvitations = [...state.eventRsvpInvitations, invitation];
      return {
        ...state,
        eventRsvpInvitations,
        totalEventRsvpInvitations: state.totalEventRsvpInvitations + 1
      };
    }
    case SELECT_EVENT_RSVP_INVITATION: {
      const {
        selectedAll,
        selectedInvitationsIds,
        excludedInvitationsIds,
        selectedCount,
        eventRsvpInvitations
      } = state;
      const invitationId = payload;
      const invitation = eventRsvpInvitations.find(
        (a) => a.id === invitationId
      );
      invitation.checked = true;

      let newState = {};

      if (selectedAll) {
        newState = {
          ...state,
          excludedInvitationsIds: excludedInvitationsIds.filter(
            (it) => it !== invitationId
          ),
          selectedInvitationsIds: []
        };
      } else {
        newState = {
          ...state,
          selectedInvitationsIds: [...selectedInvitationsIds, invitationId],
          excludedInvitationsIds: []
        };
      }

      return {
        ...newState,
        eventRsvpInvitations,
        selectedCount: selectedCount + 1
      };
    }
    case UNSELECT_EVENT_RSVP_INVITATION: {
      const {
        selectedAll,
        selectedInvitationsIds,
        excludedInvitationsIds,
        selectedCount,
        eventRsvpInvitations
      } = state;
      const invitationId = payload;
      const invitation = eventRsvpInvitations.find(
        (a) => a.id === invitationId
      );
      invitation.checked = false;

      let newState = {};

      if (selectedAll) {
        newState = {
          ...state,
          excludedInvitationsIds: [...excludedInvitationsIds, invitationId],
          selectedInvitationsIds: []
        };
      } else {
        newState = {
          ...state,
          selectedInvitationsIds: selectedInvitationsIds.filter(
            (it) => it !== invitationId
          ),
          excludedInvitationsIds: []
        };
      }

      return {
        ...newState,
        eventRsvpInvitations,
        selectedCount: selectedCount - 1
      };
    }
    case CLEAR_ALL_SELECTED_EVENT_RSVP_INVITATIONS: {
      const eventRsvpInvitations = state.eventRsvpInvitations.map((i) => ({
        ...i,
        checked: false
      }));
      return {
        ...state,
        excludedInvitationsIds: [],
        selectedInvitationsIds: [],
        selectedAll: false,
        selectedCount: 0,
        eventRsvpInvitations
      };
    }
    case SET_CURRENT_EMAIL_TEMPLATE: {
      return { ...state, currentEmailTemplate: payload };
    }
    case SEND_EVENT_RSVP_INVITATIONS_EMAILS: {
      const newState = {
        ...state,
        selectedAll: false,
        selectedInvitationsIds: [],
        excludedInvitationsIds: [],
        selectedCount: 0,
        currentFlowEvent: "",
        currentSelectionPlanId: 0
      };
      newState.eventRsvpInvitations = newState.eventRsvpInvitations.map(
        (a) => ({
          ...a,
          checked: false
        })
      );

      return { ...newState };
    }
    case SET_SELECTED_ALL: {
      const selectedAll = payload;
      const eventRsvpInvitations = state.eventRsvpInvitations.map((i) => ({
        ...i,
        checked: selectedAll
      }));
      const selectedCount = selectedAll ? state.totalEventRsvpInvitations : 0;
      return {
        ...state,
        eventRsvpInvitations,
        selectedAll,
        selectedCount,
        selectedInvitationsIds: [],
        excludedInvitationsIds: []
      };
    }
    default:
      return state;
  }
};

export default eventRSVPInvitationListReducer;
