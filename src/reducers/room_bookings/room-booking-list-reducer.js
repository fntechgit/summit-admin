/**
 * Copyright 2019 OpenStack Foundation
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
import { epochToMoment } from "openstack-uicore-foundation/lib/utils/methods";

import {
  RECEIVE_ROOM_BOOKINGS,
  REQUEST_ROOM_BOOKINGS,
  ROOM_BOOKING_REFUNDED
} from "../../actions/room-booking-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  roomBookings: [],
  term: "",
  order: "start_datetime",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalRoomBookings: 0,
  filters: {
    // filters definition
    email_filter: { operator: null, value: "" }
  }
};

const roomBookingListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_ROOM_BOOKINGS: {
      const { order, orderDir, perPage, term, filters } = payload;
      return { ...state, order, orderDir, perPage, term, filters };
    }
    case RECEIVE_ROOM_BOOKINGS: {
      const { current_page, total, last_page } = payload.response;
      const room_bookings = payload.response.data.map((rb) => {
        const ownerName = `${rb.owner.first_name} ${rb.owner.last_name}`;
        const created = epochToMoment(rb.created).format("M/D/YYYY, h:mm:ss a");
        return {
          ...rb,
          created,
          owner_name: ownerName,
          owner_email: rb.owner.email,
          room_name: rb.room.name,
          room_id: rb.room.id,
          amount_str: `$${rb.amount}`,
          refunded_amount_str: `$${rb.refunded_amount}`
        };
      });

      return {
        ...state,
        roomBookings: room_bookings,
        currentPage: current_page,
        totalRoomBookings: total,
        lastPage: last_page
      };
    }
    case ROOM_BOOKING_REFUNDED: {
      const roomBooking = payload.response;
      const roomBookings = [...state.roomBookings];
      roomBookings.forEach((rb) => {
        if (rb.id === roomBooking.id) {
          rb.status = "Refunded";
          rb.refunded_amount_str = `$${roomBooking.refunded_amount}`;
        }
      });

      return { ...state, roomBookings };
    }
    default:
      return state;
  }
};

export default roomBookingListReducer;
