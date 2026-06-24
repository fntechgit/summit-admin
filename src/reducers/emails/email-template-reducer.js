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
 */

import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";

import {
  RECEIVE_TEMPLATE,
  RESET_TEMPLATE_FORM,
  TEMPLATE_ADDED,
  TEMPLATE_UPDATED,
  RECEIVE_EMAIL_CLIENTS,
  TEMPLATE_RENDER_RECEIVED,
  VALIDATE_RENDER,
  REQUEST_TEMPLATE_RENDER,
  UPDATE_JSON_DATA
} from "../../actions/email-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

import emailTemplateDefaultValues from "../../data/email_template_variables_sample.json";

export const DEFAULT_ENTITY = {
  id: 0,
  identifier: "",
  html_content: "",
  original_html_content: "",
  mjml_content: "",
  original_mjml_content: "",
  plain_content: "",
  from_email: "",
  subject: "",
  // default values
  max_retries: 1,
  is_active: true,
  allowed_clients: [],
  parent: null,
  versions: []
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  templateLoading: false,
  clients: null,
  preview: null,
  json_data: emailTemplateDefaultValues,
  errors: {},
  render_errors: [],
  latestRenderId: 0
};

const normalizeEntityFields = (entity) => {
  const normalized = { ...entity };
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === null) {
      normalized[key] = "";
    }
  });
  return normalized;
};

const emailTemplateReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      // we need this in case the token expired while editing the form
      if (Object.prototype.hasOwnProperty.call(payload, "persistStore")) {
        return state;
      }
      return DEFAULT_STATE;

    case SET_CURRENT_SUMMIT:
    case RESET_TEMPLATE_FORM:
      return {
        ...state,
        entity: { ...DEFAULT_ENTITY },
        errors: {},
        // reset render sequencing so in-flight responses for the previous
        // template cannot match latestRenderId and repopulate the new form
        preview: null,
        render_errors: [],
        templateLoading: false,
        latestRenderId: 0
      };

    case RECEIVE_TEMPLATE: {
      const entity = normalizeEntityFields({ ...payload.response });
      return {
        ...state,
        entity: {
          ...DEFAULT_ENTITY,
          ...entity,
          original_mjml_content: entity.mjml_content,
          original_html_content: entity.html_content
        },
        preview: null,
        render_errors: [],
        templateLoading: false,
        latestRenderId: 0
      };
    }

    case TEMPLATE_ADDED:
    case TEMPLATE_UPDATED: {
      const entity = normalizeEntityFields({ ...payload.response });
      return {
        ...state,
        entity: {
          ...DEFAULT_ENTITY,
          ...entity,
          original_mjml_content: entity.mjml_content,
          original_html_content: entity.html_content
        },
        preview: null,
        render_errors: [],
        templateLoading: false,
        latestRenderId: 0
      };
    }

    case RECEIVE_EMAIL_CLIENTS:
      return { ...state, clients: payload.response.data };

    case REQUEST_TEMPLATE_RENDER:
      return {
        ...state,
        templateLoading: true,
        latestRenderId: payload?.requestId ?? state.latestRenderId
      };

    case TEMPLATE_RENDER_RECEIVED:
      if (
        payload?.requestId != null &&
        payload.requestId !== state.latestRenderId
      ) {
        return state;
      }
      return {
        ...state,
        templateLoading: false,
        preview: payload.response.html_content,
        render_errors: []
      };

    case VALIDATE_RENDER:
      if (
        payload?.requestId != null &&
        payload.requestId !== state.latestRenderId
      ) {
        return state;
      }
      return {
        ...state,
        templateLoading: false,
        render_errors: payload.errors
      };

    case UPDATE_JSON_DATA:
      return { ...state, json_data: payload };

    case VALIDATE:
      return { ...state, errors: payload.errors };

    default:
      return state;
  }
};

export default emailTemplateReducer;
