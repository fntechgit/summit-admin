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
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  RECEIVE_TICKET,
  UPDATE_TICKET,
  TICKET_SAVED,
  TICKET_UPDATED,
  TICKET_MEMBER_REASSIGNED,
  BADGE_ADDED_TO_TICKET,
  TICKET_CANCEL_REFUND,
  TICKET_REFUNDED
} from "../../actions/ticket-actions";
import {
  BADGE_DELETED,
  BADGE_PRINTS_CLEARED,
  BADGE_TYPE_CHANGED,
  FEATURE_BADGE_ADDED,
  FEATURE_BADGE_REMOVED
} from "../../actions/badge-actions";
import {
  RECEIVE_SUMMIT,
  SET_CURRENT_SUMMIT
} from "../../actions/summit-actions";
import { DECIMAL_DIGITS } from "../../utils/constants";

export const DEFAULT_ENTITY = {
  id: 28,
  bought_date: 0,
  currency: "USD",
  currency_symbol: "$",
  discount: 0,
  external_attendee_id: null,
  external_order_id: null,
  final_amount: 500,
  number: "",
  order_id: 30,
  raw_cost: 500,
  refunded_amount: 0,
  status: "",
  badge: null,
  promocode: null,
  ticket_type: null,
  owner: null,
  applied_taxes: [],
  attendee: {},
  attendee_company: "",
  is_active: true,
  refund_requests: [],
  refund_requests_taxes: [],
  ticket_type_id: 0
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {},
  summitTZ: ""
};

const ticketReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case RECEIVE_SUMMIT:
    case SET_CURRENT_SUMMIT: {
      const summit = payload.response;
      return { ...state, summitTZ: summit.time_zone_id };
    }
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY } };
    }
    case UPDATE_TICKET: {
      return { ...state, entity: { ...payload } };
    }
    case TICKET_REFUNDED:
    case TICKET_CANCEL_REFUND:
    case TICKET_SAVED:
    case RECEIVE_TICKET: {
      const entity = { ...payload.response };
      const bought_date = entity.bought_date
        ? epochToMomentTimeZone(entity.bought_date, state.summitTZ).format(
            "MMMM Do YYYY, h:mm:ss a"
          )
        : null;
      let attendee_full_name = null;
      let promocode_name = "N/A";
      let attendee_company = "N/A";
      let attendee_email = null;
      const final_amount_formatted = `${
        entity.currency_symbol
      }${entity.final_amount.toFixed(DECIMAL_DIGITS)}`;
      const refunded_amount_formatted = `${
        entity.currency_symbol
      }${entity.total_refunded_amount.toFixed(DECIMAL_DIGITS)}`;
      const adjusted_total_ticket_purchase_price_formatted = `${
        entity.currency_symbol
      }${(entity.final_amount - entity.total_refunded_amount).toFixed(
        DECIMAL_DIGITS
      )}`;

      Object.entries(entity).forEach(([key, value]) => {
        entity[key] = value == null ? "" : value;
      });

      if (entity.promo_code) {
        promocode_name = entity.promo_code.code;
      }

      if (entity.owner) {
        attendee_company = entity.owner?.company;
        attendee_email = entity.owner.email;
        if (entity.owner.first_name && entity.owner.last_name) {
          attendee_full_name = `${entity.owner.first_name} ${entity.owner.last_name}`;
        } else if (
          entity.owner.member?.first_name &&
          entity.owner.member?.last_name
        ) {
          attendee_full_name = `${entity.owner.member.first_name} ${entity.owner.member.last_name}`;
        }
      }

      const approved_refunds_taxes = [];

      if (entity.hasOwnProperty("refund_requests")) {
        entity.refund_requests = entity.refund_requests.map((r) => {
          r.refunded_taxes.forEach((t) => {
            // field for the tax column of that refund
            r[`tax_${t.tax.id}_refunded_amount`] = `${
              entity.currency_symbol
            }${t.refunded_amount.toFixed(DECIMAL_DIGITS)}`;
            // add tax type to array
            approved_refunds_taxes.push(t);
          });

          return {
            ...r,
            requested_by_fullname: r.requested_by
              ? `${r.requested_by.first_name} ${r.requested_by.last_name}`
              : "TBD",
            action_by_fullname: r.action_by
              ? `${r.action_by.first_name} ${r.action_by.last_name}`
              : "TBD",
            refunded_amount_formatted: `${
              entity.currency_symbol
            }${r.refunded_amount.toFixed(DECIMAL_DIGITS)}`,
            total_refunded_amount_formatted: `${
              entity.currency_symbol
            }${r.total_refunded_amount.toFixed(DECIMAL_DIGITS)}`
          };
        });
      }

      const unique_approved_refunds_taxes = approved_refunds_taxes.filter(
        (tax, idx, arr) => idx === arr.findIndex((obj) => obj.id === tax.id)
      );

      return {
        ...state,
        entity: {
          ...DEFAULT_ENTITY,
          ...entity,
          attendee_full_name,
          bought_date,
          promocode_name,
          final_amount_formatted,
          refunded_amount_formatted,
          ticket_type_id: entity?.ticket_type?.id,
          attendee_email,
          attendee_company,
          adjusted_total_ticket_purchase_price_formatted,
          refund_requests_taxes: unique_approved_refunds_taxes
        }
      };
    }
    case TICKET_UPDATED: {
      const entity = { ...payload.response };
      return {
        ...state,
        entity: {
          ...state.entity,
          is_active: entity.is_active,
          ticket_type_id: entity?.ticket_type?.id
        }
      };
    }
    case TICKET_MEMBER_REASSIGNED: {
      return state;
    }
    case BADGE_ADDED_TO_TICKET: {
      const entity = { ...payload.response };
      return { ...state, entity: { ...state.entity, badge: { ...entity } } };
    }
    case BADGE_DELETED: {
      return { ...state, entity: { ...state.entity, badge: null } };
    }
    case BADGE_TYPE_CHANGED: {
      const { newBadgeType } = payload;
      return {
        ...state,
        entity: {
          ...state.entity,
          badge: { ...state.entity.badge, type_id: newBadgeType.id }
        }
      };
    }
    case FEATURE_BADGE_REMOVED: {
      const { featureId } = payload;
      const badgeFeatures = state.entity.badge.features.filter(
        (f) => f.id !== featureId
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          badge: { ...state.entity.badge, features: badgeFeatures }
        }
      };
    }
    case FEATURE_BADGE_ADDED: {
      const newBadgeFeature = { ...payload.feature };
      const badgeFeatures = [...state.entity.badge.features, newBadgeFeature];

      return {
        ...state,
        entity: {
          ...state.entity,
          badge: { ...state.entity.badge, features: badgeFeatures }
        }
      };
    }
    case BADGE_PRINTS_CLEARED: {
      return {
        ...state,
        entity: {
          ...state.entity,
          badge: { ...state.entity.badge, print_excerpt: {} }
        }
      };
    }
    default:
      return state;
  }
};

export default ticketReducer;
