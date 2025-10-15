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
import {
  RECEIVE_SPONSORS,
  REQUEST_SPONSORS,
  SPONSOR_DELETED,
  SPONSOR_ORDER_UPDATED
} from "../../actions/sponsor-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  sponsors: [],
  order: "order",
  orderDir: 1,
  totalSponsors: 0
};

const sponsorListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSORS: {
      const { order, orderDir, term } = payload;

      return { ...state, order, orderDir, term };
    }
    case RECEIVE_SPONSORS: {
      let sponsors = payload;
      sponsors = sponsors.map((s) => {
        const sponsorship_name = s.sponsorship ? s.sponsorship.type.name : "";
        const company_name = s.company ? s.company.name : "";

        return { ...s, sponsorship_name, company_name };
      });

      return { ...state, sponsors, totalSponsors: sponsors.length };
    }
    case SPONSOR_ORDER_UPDATED: {
      const sponsors = payload.map((s, index) => {
        const sponsorship_name = s.sponsorship ? s.sponsorship.type.name : "";
        const company_name = s.company ? s.company.name : "";
        const order = s.order + index;

        return { ...s, sponsorship_name, company_name, order };
      });

      return { ...state, sponsors };
    }
    case SPONSOR_DELETED: {
      const { sponsorId } = payload;
      return {
        ...state,
        sponsors: state.sponsors.filter((t) => t.id !== sponsorId)
      };
    }
    default:
      return state;
  }
};

export default sponsorListReducer;
