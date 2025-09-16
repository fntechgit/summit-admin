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
  RECEIVE_SPONSOR_USER_REQUESTS,
  RECEIVE_SPONSOR_USERS,
  REQUEST_SPONSOR_USER_REQUESTS,
  REQUEST_SPONSOR_USERS,
  RECEIVE_SPONSOR_USER_GROUPS,
  SPONSOR_USER_DELETED
} from "../../actions/sponsor-users-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { titleCase } from "../../utils/methods";

const DEFAULT_STATE = {
  term: "",
  userGroups: [],
  requests: {
    items: [],
    order: "id",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalCount: 0
  },
  users: {
    items: [],
    order: "id",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalCount: 0
  }
};

const sponsorUsersListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case RECEIVE_SPONSOR_USER_GROUPS: {
      return { ...state, userGroups: payload.response.data };
    }
    case REQUEST_SPONSOR_USER_REQUESTS: {
      const { order, orderDir, page, term, perPage } = payload;

      return {
        ...state,
        term,
        requests: {
          items: [],
          order,
          orderDir,
          currentPage: page,
          perPage
        }
      };
    }
    case RECEIVE_SPONSOR_USER_REQUESTS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const items = payload.response.data.map((r) => ({
        id: r.id,
        requester_first_name: `${r.requester_first_name} ${r.requester_last_name}`,
        requester_email: r.requester_email,
        company_id: r.company_id,
        company_name: r.company_name,
        created: epochToMoment(r.created).format("MMMM Do YYYY, h:mm:ss a")
      }));

      return {
        ...state,
        requests: {
          ...state.requests,
          items,
          currentPage,
          totalCount: total,
          lastPage
        }
      };
    }
    case REQUEST_SPONSOR_USERS: {
      const { order, orderDir, page, term, perPage } = payload;

      return {
        ...state,
        term,
        users: {
          items: [],
          order,
          orderDir,
          currentPage: page,
          perPage
        }
      };
    }
    case RECEIVE_SPONSOR_USERS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const items = payload.response.data.map((u) => {
        const accessRights = u.access_rights.reduce(
          (res, it) => [
            ...new Set([...res, ...it.groups.map((g) => titleCase(g.name))])
          ],
          []
        );

        return {
          id: u.id,
          first_name: `${u.first_name} ${u.last_name}`,
          email: u.email,
          company_name: u.company_name,
          access_rights: accessRights,
          active: u.active
        };
      });

      return {
        ...state,
        users: {
          ...state.users,
          items,
          currentPage,
          totalCount: total,
          lastPage
        }
      };
    }
    case SPONSOR_USER_DELETED: {
      const { userId } = payload;
      const users = state.users.filter((u) => u.id !== userId);

      return { ...state, users };
    }
    default:
      return state;
  }
};

export default sponsorUsersListReducer;
