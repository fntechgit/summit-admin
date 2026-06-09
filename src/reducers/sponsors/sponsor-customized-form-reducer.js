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
import {
  RECEIVE_SPONSOR_CUSTOMIZED_FORM,
  RESET_SPONSOR_CUSTOMIZED_FORM
} from "../../actions/sponsor-forms-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_ENTITY = {
  id: 0,
  code: "",
  name: "",
  allowed_add_ons: [],
  opens_at: "",
  expires_at: "",
  instructions: "",
  meta_fields: [],
  items: []
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY
};

const sponsorCustomizedFormReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case RESET_SPONSOR_CUSTOMIZED_FORM:
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case RECEIVE_SPONSOR_CUSTOMIZED_FORM: {
      // this actions is dispatched by getSponsorManagedForm and getSponsorCustomizedForm
      // getSponsorManagedForm expands items.images, getSponsorCustomizedForm not,
      // so items is absent here for the customized path.
      // Add expand=items,items.images to that action if item display is ever needed in
      // the customized-form popup.
      const entity = {
        ...payload.response,
        items: (payload.response.items || []).map((it) => ({
          ...it,
          images: (it.images || []).map((img) => ({
            ...img,
            file_path: img.file_url
          }))
        }))
      };
      return { ...state, entity };
    }
    default:
      return state;
  }
};

export default sponsorCustomizedFormReducer;
