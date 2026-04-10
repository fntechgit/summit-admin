/**
 * Copyright 2024 OpenStack Foundation
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
  PAGE_TEMPLATE_ADDED,
  PAGE_TEMPLATE_UPDATED,
  RECEIVE_PAGE_TEMPLATE,
  RESET_PAGE_TEMPLATE_FORM
} from "../../actions/page-template-actions";
import { denormalizePageModules } from "../../utils/page-template";

export const DEFAULT_ENTITY = {
  id: 0,
  code: "",
  name: "",
  instructions: "",
  items: [],
  materials: [],
  meta_fields: []
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY
};

const pageTemplateReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (payload?.persistStore) {
        return state;
      }
      return DEFAULT_STATE;
    }
    case RESET_PAGE_TEMPLATE_FORM: {
      return { ...state, entity: { ...DEFAULT_ENTITY } };
    }
    case RECEIVE_PAGE_TEMPLATE: {
      const entity = { ...payload.response };

      entity.modules = denormalizePageModules(entity.modules);

      return {
        ...state,
        entity
      };
    }
    case PAGE_TEMPLATE_ADDED:
    case PAGE_TEMPLATE_UPDATED: {
      return {
        ...state,
        entity: {
          ...DEFAULT_ENTITY
        }
      };
    }
    default:
      return state;
  }
};

export default pageTemplateReducer;
