/**
 * Copyright 2017 OpenStack Foundation
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

import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_ATTENDEE,
  CHANGE_MEMBER,
  RESET_ATTENDEE_FORM,
  ATTENDEE_UPDATED,
  TICKET_ADDED,
  TICKET_DELETED,
  RSVP_DELETED,
  RECEIVE_ATTENDEE_ORDERS,
  RECEIVE_ALLOWED_EXTRA_QUESTIONS
} from "../../actions/attendee-actions";

import {
  AFFILIATION_ADDED,
  AFFILIATION_DELETED
} from "../../actions/member-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { canonicalizeObject } from "../../utils/methods";

export const DEFAULT_ENTITY = {
  id: 0,
  member: null,
  manager: null,
  first_name: "",
  last_name: "",
  email: "",
  company: "",
  company_id: 0,
  admin_notes: "",
  shared_contact_info: 0,
  summit_hall_checked_in: 0,
  disclaimer_accepted: 0,
  tickets: [],
  allowed_extra_questions: [],
  extra_question_answers: [],
  orders: [],
  tags: []
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {}
};

const attendeeReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    }
    case SET_CURRENT_SUMMIT:
    case RESET_ATTENDEE_FORM: {
      return DEFAULT_STATE;
    }
    case ATTENDEE_UPDATED:
    case RECEIVE_ATTENDEE: {
      const entity = { ...payload.response };

      canonicalizeObject(entity);

      if (entity.extra_questions) {
        entity.extra_questions = entity.extra_questions.map((q) => ({
          question_id: q.question_id,
          value: q.value
        }));
      }

      return { ...state, entity: { ...DEFAULT_ENTITY, ...entity }, errors: {} };
    }
    case RECEIVE_ATTENDEE_ORDERS: {
      const { data } = payload.response;
      return { ...state, entity: { ...state.entity, orders: data } };
    }
    case CHANGE_MEMBER: {
      return { ...state };
    }
    case TICKET_ADDED: {
      const newOrder = payload.response;
      const newTicket = newOrder.tickets[0];
      return {
        ...state,
        entity: {
          ...state.entity,
          tickets: [...state.entity.tickets, newTicket],
          orders: [...state.entity.orders, newOrder]
        }
      };
    }
    case TICKET_DELETED: {
      const { ticketId } = payload;
      return {
        ...state,
        entity: {
          ...state.entity,
          tickets: state.entity.tickets.filter((t) => t.id !== ticketId)
        }
      };
    }
    case RSVP_DELETED: {
      const { rsvpId } = payload;

      return {
        ...state,
        entity: {
          ...state.entity,
          member: {
            ...state.entity.member,
            rsvp: state.entity.member.rsvp.filter((r) => r.id !== rsvpId)
          }
        }
      };
    }
    case AFFILIATION_ADDED: {
      const affiliation = { ...payload.response };

      if (
        state.entity.member &&
        state.entity.member.hasOwnProperty("affiliations")
      ) {
        return {
          ...state,
          entity: {
            ...state.entity,
            member: {
              ...state.entity.member,
              affiliations: [...state.entity.member.affiliations, affiliation]
            }
          }
        };
      }
      return state;
    }
    case AFFILIATION_DELETED: {
      const { affiliationId } = payload;
      if (
        state.entity.member &&
        state.entity.member.hasOwnProperty("affiliations")
      ) {
        const affiliations = state.entity.member.affiliations.filter(
          (a) => a.id !== affiliationId
        );

        return {
          ...state,
          entity: {
            ...state.entity,
            member: {
              ...state.entity.member,
              affiliations
            }
          }
        };
      }
      return state;
    }
    case VALIDATE: {
      return { ...state, errors: payload.errors };
    }
    case RECEIVE_ALLOWED_EXTRA_QUESTIONS: {
      const mainExtraQuestions = payload;
      return {
        ...state,
        entity: { ...state.entity, allowed_extra_questions: mainExtraQuestions }
      };
    }
    default:
      return state;
  }
};

export default attendeeReducer;
