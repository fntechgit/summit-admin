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
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  RECEIVE_SELECTION_PLANS,
  REQUEST_SELECTION_PLANS,
  SELECTION_PLAN_DELETED,
  SELECTION_PLAN_ADDED
} from "../../actions/selection-plan-actions";

const DEFAULT_STATE = {
  selectionPlans: [],
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  order: "id",
  orderDir: 1,
  totalSelectionPlans: 0,
  term: ""
};

const selectionPlanListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SELECTION_PLANS: {
      const { order, orderDir } = payload;

      return { ...state, order, orderDir };
    }
    case RECEIVE_SELECTION_PLANS: {
      const { current_page, total, last_page, data } = payload.response;

      const selectionPlans = data.map((sp) => ({
        ...sp,
        is_enabled: sp.is_enabled ? "yes" : "no",
        is_hidden: sp.is_hidden ? "yes" : "no"
      }));

      return {
        ...state,
        selectionPlans,
        totalSelectionPlans: total,
        currentPage: current_page,
        lastPage: last_page
      };
    }
    case SELECTION_PLAN_ADDED: {
      return state;
    }
    case SELECTION_PLAN_DELETED: {
      const { selectionPlanId } = payload;
      return {
        ...state,
        selectionPlans: state.selectionPlans.filter(
          (t) => t.id !== selectionPlanId
        )
      };
    }
    default:
      return state;
  }
};

export default selectionPlanListReducer;
