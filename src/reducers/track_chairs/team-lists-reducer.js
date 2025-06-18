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
import _ from "lodash";
import {
  RECEIVE_TC_SELECTION_PLANS,
  RECEIVE_SOURCE_LIST,
  RECEIVE_TEAM_LIST,
  REORDER_LIST,
  REQUEST_SOURCE_LIST,
  REQUEST_TEAM_LIST,
  REVERT_LISTS,
  SET_SOURCE_SEL_PLAN,
  TEAM_LIST_UPDATED
} from "../../actions/track-chair-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const getMetaData = (items) =>
  items.reduce(
    (results, it) => {
      switch (it.level) {
        case "Beginner":
          results.beginner++;
          break;
        case "Intermediate":
          results.intermediate++;
          break;
        case "Advanced":
          results.advanced++;
          break;
        default:
          results.na++;
      }

      return results;
    },
    { beginner: 0, intermediate: 0, advanced: 0, na: 0 }
  );

const DEFAULT_STATE = {
  selectionPlans: [],
  sourceSelPlanId: null,
  sourceTrackId: null,
  sourceSearchTerm: "",
  sourceList: null,
  prevList: null,
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
    case RECEIVE_TC_SELECTION_PLANS: {
      const { data } = payload.response;

      const selPlansWithVisibleTracks = data.filter((sp) =>
        sp.track_groups.some((tg) => tg.tracks.some((t) => t.chair_visible))
      );

      return { ...state, selectionPlans: selPlansWithVisibleTracks };
    }
    case SET_SOURCE_SEL_PLAN: {
      const { selectionPlanId } = payload;
      return {
        ...DEFAULT_STATE,
        selectionPlans: state.selectionPlans,
        sourceSelPlanId: selectionPlanId
      };
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
        level: d.level,
        meta: {
          selectors_count: d.selectors_count,
          likers_count: d.likers_count,
          passers_count: d.passers_count,
          track_chair_avg_score: d.track_chair_avg_score,
          comments_count: d.comments_count
        }
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
      return { ...state, sourceTrackId: trackId };
    }
    case RECEIVE_TEAM_LIST: {
      const { id, selected_presentations: selections, hash } = payload.response;
      const items = selections
        .map((sp) => ({
          id: sp.presentation.id,
          order: sp.order,
          title: sp.presentation.title,
          level: sp.presentation.level,
          meta: {
            selectors_count: sp.presentation.selectors_count,
            likers_count: sp.presentation.likers_count,
            passers_count: sp.presentation.passers_count,
            track_chair_avg_score: sp.presentation.track_chair_avg_score,
            comments_count: sp.presentation.comments_count
          }
        }))
        .sort((a, b) => a.order - b.order);

      const meta = getMetaData(items);

      return {
        ...state,
        teamList: {
          id,
          dragIn: true,
          dragOut: false,
          sortable: true,
          hash,
          items,
          meta
        }
      };
    }
    case REORDER_LIST: {
      const { items } = payload;
      const newState = _.cloneDeep(state);
      const newItems = items.map((it, i) => ({ ...it, order: i + 1 }));

      // only store the original list for rollback
      if (!newState.prevList)
        newState.prevList = _.cloneDeep(newState.teamList);

      newState.teamList.items = newItems;

      return newState;
    }
    case REVERT_LISTS: {
      const teamList = state.prevList || state.teamList;
      return { ...state, teamList: { ...teamList } };
    }
    case TEAM_LIST_UPDATED: {
      const list = payload.response;

      const meta = getMetaData(state.teamList.items);

      return {
        ...state,
        teamList: { ...state.teamList, hash: list.hash, meta },
        prevList: null
      };
    }
    default:
      return state;
  }
};

export default teamListsReducer;
