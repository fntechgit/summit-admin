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
  RECEIVE_EMAIL_FLOW_EVENTS,
  REQUEST_EMAIL_FLOW_EVENTS
} from "../../actions/email-flows-events-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { DEFAULT_PER_PAGE } from "../../utils/constants";

const DEFAULT_STATE = {
  emailFlowEvents: [],
  order: "email_template_identifier",
  orderDir: 1,
  totalEmailFlowEvents: 0,
  term: "",
  currentPage: 1,
  lastPage: 1,
  perPage: DEFAULT_PER_PAGE
};

const emailFlowEventsListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EMAIL_FLOW_EVENTS: {
      const { order, orderDir, term } = payload;
      return { ...state, order, orderDir, term };
    }
    case RECEIVE_EMAIL_FLOW_EVENTS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      return {
        ...state,
        emailFlowEvents: payload.response.data,
        totalEmailFlowEvents: total,
        currentPage,
        lastPage
      };
    }
    default:
      return state;
  }
};

export default emailFlowEventsListReducer;
