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
  SET_SOURCE_SEL_PLAN,
  SET_TEAM_SEL_PLAN,
  REQUEST_SOURCE_LIST,
  RECEIVE_SOURCE_LIST,
  REQUEST_TEAM_LIST,
  RECEIVE_TEAM_LIST,
  REORDER_LIST,
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
  teamList: null
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
      return { ...state, sourceSelPlanId: selectionPlanId};
    }
    case SET_TEAM_SEL_PLAN: {
      const { selectionPlanId } = payload;
      return { ...state, teamSelPlanId: selectionPlanId};
    }
    case REQUEST_SOURCE_LIST: {
      const {trackId, searchTerm} = payload;
      return {...state, sourceTrackId: trackId, sourceSearchTerm: searchTerm};
    }
    case RECEIVE_SOURCE_LIST: {
      const { data } = payload.response;
      const selections = data.map((d, idx) => ({id: d.id, order: idx, presentation: d, type: "source"}))
      return { ...state, sourceList: {id: "source", hash: "na", type: "out", selections} };
    }
    case REQUEST_TEAM_LIST: {
      const {trackId} = payload;
      return {...state, teamTrackId: trackId};
    }
    case RECEIVE_TEAM_LIST: {
      const {id, type, name, selected_presentations, hash} = payload.response;
      const selections = selected_presentations.map(sp => ({id: sp.presentation.id, order: sp.order, title: sp.presentation.title}));
      console.log("RECEIVE_TEAM_LIST: ", selections);
      return { ...state, teamList: {id, type, name, items, hash} };
    }
    case REORDER_LIST: {
      const {selections} = payload;

      const sortedSelections = selections.map((s,i) => (
        {...s, order: i+1}
      ));

      console.log("REORDER_LIST: ", sortedSelections);


      return { ...state, teamList: {...state.teamList, selections: sortedSelections}}
    }
    case TEAM_LIST_UPDATED: {
      const list = payload.response;

      return {
        ...state,
        teamList: {...state.teamList, hash: list.hash}
      };
    }
    default:
      return state;
  }
};

export default teamListsReducer;
