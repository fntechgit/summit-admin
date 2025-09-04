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
  REQUEST_SPONSOR_USER_REQUESTS,
  RECEIVE_SPONSOR_USER_REQUESTS,
} from "../../actions/sponsor-users-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  requests: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  users: [],
};

const sponsorUsersListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_USER_REQUESTS: {
      const { order, orderDir, page, term } = payload;

      return {
        ...state,
        order,
        orderDir,
        requests: [],
        currentPage: page,
        term
      };
    }
    case RECEIVE_SPONSOR_USER_REQUESTS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const requests = payload.response.data.map(r => ({
        id: r.id,
        requester_first_name: `${r.requester_first_name} ${r.requester_last_name}`,
        requester_email: r.requester_email,
        company_name: r.company_name,
        created: epochToMoment(r.created).format("MMMM Do YYYY, h:mm:ss a"),
      }));

      return {
        ...state,
        requests,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    default:
      return state;
  }
};

export default sponsorUsersListReducer;
