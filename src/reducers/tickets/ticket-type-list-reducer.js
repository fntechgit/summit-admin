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
 */

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import moment from "moment-timezone";

import {
  RECEIVE_TICKET_TYPES,
  REQUEST_TICKET_TYPES,
  TICKET_TYPE_DELETED,
  TICKET_TYPES_SEEDED
} from "../../actions/ticket-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { MILLISECONDS_TO_SECONDS } from "../../utils/constants";

const DEFAULT_STATE = {
  ticketTypes: [],
  term: "",
  order: "name",
  orderDir: 1,
  totalTicketTypes: 0,
  filters: {},
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  summitTZ: ""
};

// eslint-disable-next-line default-param-last
const ticketTypeListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_TICKET_TYPES: {
      const { term, order, orderDir, currentPage, perPage, filters, summitTZ } =
        payload;
      return {
        ...state,
        term,
        order,
        orderDir,
        currentPage,
        perPage,
        filters,
        summitTZ
      };
    }
    case RECEIVE_TICKET_TYPES: {
      const { total, last_page } = payload.response;
      const ticketTypes = payload.response.data.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        audience: t.audience,
        external_id: t.external_id ? t.external_id : "N/A",
        badge_type_name: t.hasOwnProperty("badge_type")
          ? t.badge_type.name
          : "TBD",
        cost: t?.cost,
        quantity_2_sell: t?.quantity_2_sell,
        sales_start_date: t.sales_start_date
          ? moment(t.sales_start_date * MILLISECONDS_TO_SECONDS)
              .tz(state.summitTZ)
              .format("MMMM Do YYYY, h:mm a")
          : "TBD",
        sales_end_date: t.sales_end_date
          ? moment(t.sales_end_date * MILLISECONDS_TO_SECONDS)
              .tz(state.summitTZ)
              .format("MMMM Do YYYY, h:mm a")
          : "TBD"
      }));

      return {
        ...state,
        ticketTypes,
        totalTicketTypes: total,
        lastPage: last_page
      };
    }
    case TICKET_TYPES_SEEDED: {
      const { total, last_page } = payload.response;
      const ticketTypes = payload.response.data.map((t) => ({
        id: t.id,
        name: t.name,
        external_id: t.external_id,
        badge_type_name: t.hasOwnProperty("badge_type")
          ? t.badge_type.name
          : "TBD",
        cost: t?.cost
      }));

      return {
        ...state,
        ticketTypes: [...state.ticketTypes, ticketTypes],
        totalTicketTypes: total,
        lastPage: last_page
      };
    }
    case TICKET_TYPE_DELETED: {
      const { ticketTypeId } = payload;
      return {
        ...state,
        ticketTypes: state.ticketTypes.filter((t) => t.id !== ticketTypeId)
      };
    }
    default:
      return state;
  }
};

export default ticketTypeListReducer;
