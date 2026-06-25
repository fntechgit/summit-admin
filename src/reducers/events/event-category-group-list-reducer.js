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
import {
  RECEIVE_EVENT_CATEGORY_GROUPS,
  REQUEST_EVENT_CATEGORY_GROUPS,
  EVENT_CATEGORY_GROUP_DELETED
} from "../../actions/event-category-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  eventCategoryGroups: [],
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalEventCategoryGroups: 0
};

const eventCategoryGroupListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EVENT_CATEGORY_GROUPS: {
      const { order, orderDir, term, perPage, currentPage } = payload;
      return { ...state, order, orderDir, term, perPage, currentPage };
    }
    case RECEIVE_EVENT_CATEGORY_GROUPS: {
      const { total, last_page, current_page } = payload.response;
      const eventCategoryGroups = payload.response.data.map((e) => ({
        id: e.id,
        name: e.name,
        color: e.color,
        type:
          e.class_name === "PresentationCategoryGroup" ? "Public" : "Private",
        categories: e.tracks.map((c) => c.name).join(", ")
      }));

      return {
        ...state,
        eventCategoryGroups,
        currentPage: current_page,
        lastPage: last_page,
        totalEventCategoryGroups: total
      };
    }
    case EVENT_CATEGORY_GROUP_DELETED: {
      const { groupId } = payload;
      return {
        ...state,
        eventCategoryGroups: state.eventCategoryGroups.filter(
          (g) => g.id !== groupId
        ),
        totalEventCategoryGroups: state.totalEventCategoryGroups - 1
      };
    }
    default:
      return state;
  }
};

export default eventCategoryGroupListReducer;
