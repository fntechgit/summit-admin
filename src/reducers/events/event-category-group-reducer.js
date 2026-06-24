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


import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_EVENT_CATEGORY_GROUP,
  RESET_EVENT_CATEGORY_GROUP_FORM,
  UPDATE_EVENT_CATEGORY_GROUP,
  RECEIVE_EVENT_CATEGORY_GROUP_META,
  EVENT_CATEGORY_GROUP_ADDED,
  CATEGORY_ADDED_TO_GROUP,
  CATEGORY_REMOVED_FROM_GROUP,
  GROUP_ADDED_TO_GROUP,
  GROUP_REMOVED_FROM_GROUP
} from "../../actions/event-category-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  class_name: null,
  name: "",
  color: "",
  description: "",
  begin_attendee_voting_period_date: 0,
  end_attendee_voting_period_date: 0,
  max_attendee_votes: 0,
  submission_begin_date: 0,
  submission_end_date: 0,
  max_submission_allowed_per_user: 0,
  tracks: [],
  allowed_groups: []
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  allClasses: [],
  errors: {}
};

// eslint-disable-next-line default-param-last
const eventCategoryGroupReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      if (Object.hasOwn(payload, "persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case SET_CURRENT_SUMMIT:
    case RESET_EVENT_CATEGORY_GROUP_FORM:
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case RECEIVE_EVENT_CATEGORY_GROUP_META: {
      const allClasses = [...payload.response];
      return { ...state, allClasses };
    }
    case UPDATE_EVENT_CATEGORY_GROUP:
      return { ...state, entity: { ...state.entity, ...payload }, errors: {} };
    case EVENT_CATEGORY_GROUP_ADDED:
    case RECEIVE_EVENT_CATEGORY_GROUP: {
      const entity = { ...payload.response };

      for (const [key, value] of Object.entries(entity)) {
        entity[key] = value == null ? "" : value;
      }

      return { ...state, entity: { ...DEFAULT_ENTITY, ...entity } };
    }
    case CATEGORY_ADDED_TO_GROUP: {
      const category = { ...payload.category };
      return {
        ...state,
        entity: {
          ...state.entity,
          tracks: [...state.entity.tracks, category]
        }
      };
    }
    case CATEGORY_REMOVED_FROM_GROUP: {
      const { categoryId } = payload;
      const tracks = state.entity.tracks.filter((t) => t.id !== categoryId);
      return { ...state, entity: { ...state.entity, tracks } };
    }
    case GROUP_ADDED_TO_GROUP: {
      const allowedGroup = { ...payload.allowedGroup };
      return {
        ...state,
        entity: {
          ...state.entity,
          allowed_groups: [...state.entity.allowed_groups, allowedGroup]
        }
      };
    }
    case GROUP_REMOVED_FROM_GROUP: {
      const { allowedGroupId } = payload;
      const allowedGroups = state.entity.allowed_groups.filter(
        (g) => g.id !== allowedGroupId
      );
      return {
        ...state,
        entity: { ...state.entity, allowed_groups: allowedGroups }
      };
    }
    case VALIDATE:
      return { ...state, errors: payload.errors };
    default:
      return state;
  }
};

export default eventCategoryGroupReducer;
