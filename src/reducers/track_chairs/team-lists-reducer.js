/**
 * Copyright 2017 OpenStack Foundation
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
  RECEIVE_SELECTION_PLANS,
  RECEIVE_SOURCE_LIST,
  RECEIVE_TEAM_LIST,
  REORDER_LIST,
  REQUEST_SOURCE_LIST,
  REQUEST_TEAM_LIST,
  SET_SOURCE_SEL_PLAN,
  SET_TEAM_SEL_PLAN,
  TEAM_LIST_UPDATED
} from "../../actions/track-chair-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  selectionPlans: [],
  sourceSelPlanId: null,
  sourceTrackId: null,
  sourceSearchTerm: "",
  sourceList: null,
  teamSelPlanId: null,
  teamTrackId: null,
  teamList: null,
  sourcePage: 1,
  sourceLastPage: 1
};

const teamListsReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case RECEIVE_SELECTION_PLANS: {
      const { data } = payload.response;

      return { ...state, selectionPlans: data };
    }
    case SET_SOURCE_SEL_PLAN: {
      const { selectionPlanId } = payload;
      return { ...state, sourceSelPlanId: selectionPlanId };
    }
    case SET_TEAM_SEL_PLAN: {
      const { selectionPlanId } = payload;
      return { ...state, teamSelPlanId: selectionPlanId };
    }
    case REQUEST_SOURCE_LIST: {
      const { trackId, searchTerm } = payload;
      return { ...state, sourceTrackId: trackId, sourceSearchTerm: searchTerm };
    }
    case RECEIVE_SOURCE_LIST: {
      const {
        data,
        current_page: sourcePage,
        last_page: sourceLastPage
      } = payload.response;

      const newItems = data.map((d, idx) => ({
        id: d.id,
        order: idx,
        title: d.title,
        level: d.level
      }));

      const items =
        sourcePage === 1 ? newItems : [...state.sourceList.items, ...newItems];

      return {
        ...state,
        sourcePage,
        sourceLastPage,
        sourceList: {
          id: "source",
          hash: "na",
          dragIn: false,
          dragOut: true,
          sortable: false,
          items
        }
      };
    }
    case REQUEST_TEAM_LIST: {
      const { trackId } = payload;
      return { ...state, teamTrackId: trackId };
    }
    case RECEIVE_TEAM_LIST: {
      const { id, selected_presentations: selections, hash } = payload.response;
      const items = selections
        .map((sp) => ({
          id: sp.presentation.id,
          order: sp.order,
          title: sp.presentation.title,
          level: sp.presentation.level
        }))
        .sort((a, b) => a.order - b.order);

      return {
        ...state,
        teamList: {
          id,
          dragIn: true,
          dragOut: false,
          sortable: true,
          hash,
          items
        }
      };
    }
    case REORDER_LIST: {
      const { items } = payload;

      const newItems = items.map((it, i) => ({ ...it, order: i + 1 }));

      return { ...state, teamList: { ...state.teamList, items: newItems } };
    }
    case TEAM_LIST_UPDATED: {
      const list = payload.response;

      return {
        ...state,
        teamList: { ...state.teamList, hash: list.hash }
      };
    }
    default:
      return state;
  }
};

export default teamListsReducer;
