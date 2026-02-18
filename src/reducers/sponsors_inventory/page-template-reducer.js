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

import moment from "moment-timezone";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  PAGE_TEMPLATE_ADDED,
  PAGE_TEMPLATE_UPDATED,
  RECEIVE_PAGE_TEMPLATE,
  RESET_PAGE_TEMPLATE_FORM
} from "../../actions/page-template-actions";
import {
  MILLISECONDS_IN_SECOND,
  PAGE_MODULES_DOWNLOAD,
  PAGES_MODULE_KINDS
} from "../../utils/constants";

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
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return DEFAULT_STATE;
    }
    case RESET_PAGE_TEMPLATE_FORM: {
      return { ...state, entity: { ...DEFAULT_ENTITY } };
    }
    case RECEIVE_PAGE_TEMPLATE: {
      const entity = { ...payload.response };

      entity.modules = entity.modules.map((module) => {
        const tmpModule = {
          ...module,
          ...(module.upload_deadline
            ? {
                upload_deadline: moment(
                  module.upload_deadline * MILLISECONDS_IN_SECOND
                )
              }
            : {})
        };

        if (module.kind === PAGES_MODULE_KINDS.DOCUMENT) {
          if (module.file) {
            tmpModule.file = [
              {
                bucket: module.file.bucket,
                file_name: module.file.file_name,
                file_path: module.file.storage_key,
                md5: module.file.md5,
                mime_type: module.file.mime_type,
                public_url: module.file.file_url
              }
            ];
            tmpModule.type = PAGE_MODULES_DOWNLOAD.FILE;
          } else {
            tmpModule.type = PAGE_MODULES_DOWNLOAD.URL;
          }
        }
        return tmpModule;
      });

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
