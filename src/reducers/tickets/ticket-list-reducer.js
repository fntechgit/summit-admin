/**
 * Copyright 2026 OpenStack Foundation
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
  CLEAR_ALL_SELECTED_TICKETS,
  RECEIVE_TICKETS,
  REQUEST_TICKETS,
  SELECT_TICKET,
  SET_SELECTED_ALL_TICKETS,
  UNSELECT_TICKET
} from "../../actions/ticket-actions";
import { RECEIVE_SUMMIT } from "../../actions/summit-actions";
import { DECIMAL_DIGITS, SLICE_TICKET_NUMBER } from "../../utils/constants";

const DEFAULT_STATE = {
  tickets: [],
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalTickets: 0,
  selectedCount: 0,
  selectedIds: [],
  excludedIds: [],
  selectedAll: false,
  // filters
  filters: {},
  extraColumns: [],
  summitTZ: ""
};

const ticketListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case RECEIVE_SUMMIT: {
      const summit = payload.response;
      return { ...DEFAULT_STATE, summitTZ: summit.time_zone_id };
    }
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_TICKETS: {
      const { order, orderDir, page, ...rest } = payload;

      if (
        order !== state.order ||
        orderDir !== state.orderDir ||
        page !== state.currentPage
      ) {
        // if the change was in page or order, keep selection
        return {
          ...state,
          order,
          orderDir,
          currentPage: page,
          ...rest
        };
      }

      return {
        ...state,
        order,
        orderDir,
        currentPage: page,
        selectedIds: [],
        excludedIds: [],
        selectedCount: 0,
        selectedAll: false,
        ...rest
      };
    }
    case RECEIVE_TICKETS: {
      const { total, last_page, data } = payload.response;
      const { selectedAll, selectedIds, excludedIds } = state;

      const tickets = data.map((t) => {
        const bought_date = t.bought_date
          ? epochToMomentTimeZone(t.bought_date, state.summitTZ).format(
              "MMMM Do YYYY, h:mm:ss a"
            )
          : "";
        const number =
          t.external_order_id || `...${t.number.slice(SLICE_TICKET_NUMBER)}`;
        const final_amount_formatted = `${
          t.currency_symbol
        }${t.final_amount.toFixed(DECIMAL_DIGITS)}`;
        const refunded_amount_formatted = `${
          t.currency_symbol
        }${t.refunded_amount.toFixed(DECIMAL_DIGITS)}`;
        const final_amount_adjusted_formatted = `${t.currency_symbol}${(
          t.final_amount - t.refunded_amount
        ).toFixed(DECIMAL_DIGITS)}`;
        const promo_code_tags =
          t.promo_code?.tags.length > 0
            ? t.promo_code.tags.map((t) => t.tag)
            : "N/A";

        return {
          id: t.id,
          number,
          order_id: t.order_id,
          ticket_type: t.ticket_type?.name || "N/A",
          bought_date,
          owner_name:
            t.owner && t.owner.first_name && t.owner.last_name
              ? `${t.owner.first_name} ${t.owner.last_name} (${t.owner.email})`
              : t.owner
              ? `(${t.owner.email})`
              : "TBD",
          owner_first_name:
            t.owner && t.owner.first_name ? `${t.owner.first_name}` : "TBD",
          owner_last_name:
            t.owner && t.owner.last_name ? `${t.owner.last_name}` : "TBD",
          owner_email: t.owner ? t.owner.email : "TBD",
          owner_company: t.owner?.company || "TBD",
          promo_code: t.promo_code ? t.promo_code.code : "N/A",
          status: t.status,
          checked: selectedAll
            ? !excludedIds.includes(t.id)
            : selectedIds.includes(t.id),
          final_amount: final_amount_formatted,
          refunded_amount: refunded_amount_formatted,
          final_amount_adjusted: final_amount_adjusted_formatted,
          refund_requests: [...t.refund_requests],
          promo_code_tags,
          badge_type_id: t.badge?.type_id,
          badge_prints_count:
            t.hasOwnProperty("badge_prints_count") && t.badge_prints_count > 0
              ? t.badge_prints_count.toString()
              : "0"
        };
      });

      return { ...state, tickets, lastPage: last_page, totalTickets: total };
    }
    case SELECT_TICKET: {
      const { selectedAll, selectedIds, excludedIds, selectedCount, tickets } =
        state;
      const ticketId = payload;
      const ticket = tickets.find((a) => a.id === ticketId);
      ticket.checked = true;

      let newState = {};

      if (selectedAll) {
        newState = {
          ...state,
          excludedIds: excludedIds.filter((it) => it !== ticketId),
          selectedIds: []
        };
      } else {
        newState = {
          ...state,
          selectedIds: [...selectedIds, ticketId],
          excludedIds: []
        };
      }

      return { ...newState, tickets, selectedCount: selectedCount + 1 };
    }
    case UNSELECT_TICKET: {
      const { selectedAll, selectedIds, excludedIds, selectedCount, tickets } =
        state;
      const ticketId = payload;
      const ticket = tickets.find((a) => a.id === ticketId);
      ticket.checked = false;

      let newState = {};

      if (selectedAll) {
        newState = {
          ...state,
          excludedIds: [...excludedIds, ticketId],
          selectedIds: []
        };
      } else {
        newState = {
          ...state,
          selectedIds: selectedIds.filter((it) => it !== ticketId),
          excludedIds: []
        };
      }

      return { ...newState, tickets, selectedCount: selectedCount - 1 };
    }
    case SET_SELECTED_ALL_TICKETS: {
      const selectedAll = payload;
      const tickets = state.tickets.map((a) => ({
        ...a,
        checked: selectedAll
      }));
      const selectedCount = selectedAll ? state.totalTickets : 0;

      return {
        ...state,
        selectedAll,
        selectedIds: [],
        excludedIds: [],
        tickets,
        selectedCount
      };
    }
    case CLEAR_ALL_SELECTED_TICKETS:
      return {
        ...state,
        selectedIds: [],
        excludedIds: [],
        selectedCount: 0,
        selectedAll: false
      };
    default:
      return state;
  }
};

export default ticketListReducer;
