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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import { amountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import {
  RECEIVE_INVENTORY_ITEM,
  RESET_INVENTORY_ITEM_FORM,
  INVENTORY_ITEM_ADDED,
  INVENTORY_ITEM_UPDATED,
  INVENTORY_ITEM_META_FIELD_SAVED,
  INVENTORY_ITEM_META_FIELD_DELETED,
  INVENTORY_ITEM_META_FIELD_VALUE_SAVED,
  INVENTORY_ITEM_META_FIELD_VALUE_DELETED,
  INVENTORY_ITEM_IMAGE_SAVED,
  INVENTORY_ITEM_IMAGE_DELETED
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
  onsite_rate: 0,
  images: [],
  meta_fields: []
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

      entity.early_bird_rate = amountFromCents(entity.early_bird_rate);
      entity.standard_rate = amountFromCents(entity.standard_rate);
      entity.onsite_rate = amountFromCents(entity.onsite_rate);

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

      entity.early_bird_rate = amountFromCents(entity.early_bird_rate);
      entity.standard_rate = amountFromCents(entity.standard_rate);
      entity.onsite_rate = amountFromCents(entity.onsite_rate);

      return {
        ...state,
        entity: {
          ...DEFAULT_ENTITY,
          ...entity,
          meta_fields: entity.meta_fields
        }
      };
    }
    case INVENTORY_ITEM_META_FIELD_SAVED: {
      const metaField = payload.response;
      const metaFields = state.entity.meta_fields.filter(
        (m) => m.id !== metaField.id
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          meta_fields: [...metaFields, metaField]
        }
      };
    }
    case INVENTORY_ITEM_META_FIELD_DELETED: {
      const { metaFieldId } = payload;
      const metaFields = state.entity.meta_fields.filter(
        (metaField) => metaField.id !== metaFieldId
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          meta_fields: metaFields
        }
      };
    }
    case INVENTORY_ITEM_META_FIELD_VALUE_SAVED: {
      const metaFieldValue = payload.response;

      const metaField = state.entity.meta_fields.find(
        (mf) => mf.id === metaFieldValue.meta_field_type_id
      );

      if (!metaField) {
        return state;
      }

      const otherValues = metaField.values.filter(
        (value) => value.id !== metaFieldValue.id
      );

      metaField.values = [...otherValues, metaFieldValue];

      const otherMetaFields = state.entity.meta_fields.filter(
        (m) => m.id !== metaFieldValue.meta_field_type_id
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          meta_fields: [...otherMetaFields, metaField]
        }
      };
    }
    case INVENTORY_ITEM_META_FIELD_VALUE_DELETED: {
      const { metaFieldId, valueId } = payload;
      const metaField = state.entity.meta_fields.find(
        (mf) => mf.id === metaFieldId
      );

      if (metaField) {
        metaField.values = [
          ...metaField.values.filter((value) => value.id !== valueId)
        ];
      }
      const metaFields = state.entity.meta_fields.filter(
        (metaField) => metaField.id !== metaFieldId
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          meta_fields: [...metaFields, metaField]
        }
      };
    }
    case INVENTORY_ITEM_IMAGE_SAVED: {
      const image = payload.response;
      const images = state.entity.images.filter((img) => img.id !== image.id);
      return {
        ...state,
        entity: {
          ...state.entity,
          images: [...images, image]
        }
      };
    }
    case INVENTORY_ITEM_IMAGE_DELETED: {
      const { imageId } = payload;
      const images = state.entity.images.filter(
        (image) => image.id !== imageId
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          images
        }
      };
    }
    default:
      return state;
  }
};

export default inventoryItemReducer;
