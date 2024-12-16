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
  RECEIVE_INVENTORY_ITEM,
  RESET_INVENTORY_ITEM_FORM,
  INVENTORY_ITEM_ADDED,
  INVENTORY_ITEM_UPDATED
} from "../../actions/inventory-item-actions";


export const DEFAULT_ENTITY = {
  id: 0,
  code: "",
  name: "",
  description: "",
  default_quantity: 0,
  quantity_limit_per_show: 0,
  quantity_limit_per_sponsor: 0,
  early_bird_rate: 0,
  standard_rate: 0,
  onsite_rate: 0
  // images: []
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {}
};

const inventoryItemReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      } 
        return DEFAULT_STATE;
      
    }
    case RESET_INVENTORY_ITEM_FORM: {
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    }
    case RECEIVE_INVENTORY_ITEM: {
      const entity = { ...payload.response };

      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      return {
        ...state,
        entity: {
          ...DEFAULT_ENTITY,
          ...entity
        }
      };
    }
    case INVENTORY_ITEM_ADDED:
    case INVENTORY_ITEM_UPDATED: {
      const entity = { ...payload.response };

      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      return {
        ...state,
        entity: {
          ...DEFAULT_ENTITY,
          ...entity,
          original_mjml_content: entity.mjml_content,
          original_html_content: entity.html_content
        }
      };
    }
    default:
      return state;
  }
};

export default inventoryItemReducer;
