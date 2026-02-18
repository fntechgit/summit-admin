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

import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  MEDIA_UPLOAD_ADDED,
  RECEIVE_MEDIA_UPLOAD,
  RESET_MEDIA_UPLOAD_FORM,
  UPDATE_MEDIA_UPLOAD
} from "../../actions/media-upload-actions";
import { RECEIVE_ALL_MEDIA_FILE_TYPES } from "../../actions/media-file-type-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  name: "",
  description: "",
  type_id: 0,
  max_size: 0,
  min_uploads_qty: 0,
  max_uploads_qty: 0, // 0: unrestricted
  is_mandatory: false,
  is_editable: true,
  private_storage_type: "None",
  public_storage_type: "None",
  presentation_types: [],
  use_temporary_links_on_public_storage: false,
  temporary_links_public_storage_ttl: 0
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  media_file_types: [],
  errors: {}
};

const mediaUploadReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (payload?.persistStore) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    }
    case SET_CURRENT_SUMMIT:
    case RESET_MEDIA_UPLOAD_FORM: {
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    }
    case RECEIVE_ALL_MEDIA_FILE_TYPES: {
      const { data } = payload.response;
      return { ...state, media_file_types: data };
    }
    case UPDATE_MEDIA_UPLOAD: {
      return { ...state, entity: { ...payload }, errors: {} };
    }
    case MEDIA_UPLOAD_ADDED:
    case RECEIVE_MEDIA_UPLOAD: {
      const entity = { ...payload.response };

      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      return {
        ...state,
        entity: { ...DEFAULT_ENTITY, ...entity },
        preview: null
      };
    }
    case VALIDATE: {
      return { ...state, errors: payload.errors };
    }
    default:
      return state;
  }
};

export default mediaUploadReducer;
