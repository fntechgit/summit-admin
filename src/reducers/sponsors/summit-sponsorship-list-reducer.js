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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/utils/actions";

import {
  RECEIVE_SUMMIT_SPONSORSHIPS,
  REQUEST_SUMMIT_SPONSORSHIPS,
  SUMMIT_SPONSORSHIP_ADDED,
  SUMMIT_SPONSORSHIP_DELETED,
  SUMMIT_SPONSORSHIP_ORDER_UPDATED,
  SUMMIT_SPONSORSHIP_UPDATED
} from "../../actions/sponsor-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { MAX_PER_PAGE } from "../../utils/constants";

const DEFAULT_STATE = {
  sponsorships: [],
  currentPage: 1,
  lastPage: 1,
  perPage: MAX_PER_PAGE,
  order: "order",
  orderDir: 1,
  totalSponsorships: 0
};

const summitSponsorshipListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SUMMIT_SPONSORSHIPS: {
      const { order, orderDir, perPage, page } = payload;

      return { ...state, order, orderDir, perPage, page };
    }
    case RECEIVE_SUMMIT_SPONSORSHIPS: {
      const { current_page, total, last_page } = payload.response;
      const sponsorships = payload.response.data;

      sponsorships.map((s) => {
        s.sponsorship_type = s.type?.name;
        s.label = s.type?.label;
        s.size = s.type?.size;
        s.widget_title = s.widget_title ? s.widget_title : "N/A";
        s.type_id = s.type?.id;
      });

      return {
        ...state,
        sponsorships,
        currentPage: current_page,
        totalSponsorships: total,
        lastPage: last_page
      };
    }
    case SUMMIT_SPONSORSHIP_ORDER_UPDATED: {
      const sponsorships = payload;
      return { ...state, sponsorships };
    }
    case SUMMIT_SPONSORSHIP_DELETED: {
      const { sponsorshipId } = payload;
      return {
        ...state,
        sponsorships: state.sponsorships.filter((t) => t.id !== sponsorshipId),
        totalSponsorships: state.totalSponsorships - 1
      };
    }
    case SUMMIT_SPONSORSHIP_UPDATED: {
      const { response } = payload;

      const updatedSponsorship = {
        ...response,
        sponsorship_type: response.type?.name,
        label: response.type?.label,
        size: response.type?.size,
        widget_title: response.widget_title ? response.widget_title : "N/A",
        type_id: response.type?.id
      };

      const previousSponsorships = state.sponsorships.filter(
        (s) => s.id !== updatedSponsorship.id
      );

      return {
        ...state,
        sponsorships: [...previousSponsorships, updatedSponsorship]
      };
    }
    case SUMMIT_SPONSORSHIP_ADDED: {
      const { response } = payload;
      const sponsorship = {
        ...response,
        sponsorship_type: response.type?.name,
        label: response.type?.label,
        size: response.type?.size,
        widget_title: response.widget_title ? response.widget_title : "N/A",
        type_id: response.type?.id
      };
      return {
        ...state,
        sponsorships: [...state.sponsorships, sponsorship],
        totalSponsorships: state.totalSponsorships + 1
      };
    }
    default:
      return state;
  }
};

export default summitSponsorshipListReducer;
