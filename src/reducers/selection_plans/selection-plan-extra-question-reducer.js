/**
 * Copyright 2026 OpenStack Foundation
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
  RESET_SELECTION_PLAN_EXTRA_QUESTION_FORM,
  RECEIVE_SELECTION_PLAN_EXTRA_QUESTION,
  UPDATE_SELECTION_PLAN_EXTRA_QUESTION,
  SELECTION_PLAN_EXTRA_QUESTION_UPDATED,
  SELECTION_PLAN_EXTRA_QUESTION_ADDED,
  RECEIVE_SELECTION_PLAN_EXTRA_QUESTION_META,
  SELECTION_PLAN_EXTRA_QUESTION_VALUE_DELETED,
  SELECTION_PLAN_EXTRA_QUESTION_VALUE_ADDED,
  SELECTION_PLAN_EXTRA_QUESTION_VALUE_UPDATED
} from "../../actions/selection-plan-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  name: "",
  label: "",
  type: null,
  mandatory: false,
  placeholder: "",
  values: [],
  is_editable: true,
  allowed_badge_features_types: []
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  allClasses: [],
  errors: {}
};

const selectionPlanExtraQuestionReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case SET_CURRENT_SUMMIT:
    case RESET_SELECTION_PLAN_EXTRA_QUESTION_FORM:
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case RECEIVE_SELECTION_PLAN_EXTRA_QUESTION_META: {
      const allClasses = payload.response;

      return { ...state, allClasses };
    }
    case UPDATE_SELECTION_PLAN_EXTRA_QUESTION:
      return { ...state, entity: { ...payload }, errors: {} };
    case SELECTION_PLAN_EXTRA_QUESTION_ADDED:
    case RECEIVE_SELECTION_PLAN_EXTRA_QUESTION: {
      const entity = { ...payload.response };

      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      return { ...state, entity: { ...DEFAULT_ENTITY, ...entity } };
    }
    case SELECTION_PLAN_EXTRA_QUESTION_UPDATED:
      return state;
    case SELECTION_PLAN_EXTRA_QUESTION_VALUE_ADDED: {
      const entity = { ...payload.response };
      let values = [...state.entity.values];
      if (entity.is_default) {
        // reset all other values
        values = values.map((v) => ({ ...v, is_default: false }));
      }

      return {
        ...state,
        entity: { ...state.entity, values: [...values, entity] }
      };
    }
    case SELECTION_PLAN_EXTRA_QUESTION_VALUE_UPDATED: {
      const entity = { ...payload.response };
      let values_tmp = state.entity.values.filter((v) => v.id !== entity.id);
      if (entity.is_default) {
        // reset all other values
        values_tmp = values_tmp.map((v) => ({ ...v, is_default: false }));
      }

      const values = [...values_tmp, entity];

      values.sort((a, b) =>
        a.order > b.order ? 1 : a.order < b.order ? -1 : 0
      );

      return { ...state, entity: { ...state.entity, values } };
    }
    case SELECTION_PLAN_EXTRA_QUESTION_VALUE_DELETED: {
      const { valueId } = payload;
      return {
        ...state,
        entity: {
          ...state.entity,
          values: state.entity.values.filter((v) => v.id !== valueId)
        }
      };
    }
    case VALIDATE:
      return { ...state, errors: payload.errors };
    default:
      return state;
  }
};

export default selectionPlanExtraQuestionReducer;
