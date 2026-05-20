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
  RECEIVE_COMPANY,
  RESET_COMPANY_FORM,
  UPDATE_COMPANY,
  COMPANY_UPDATED,
  COMPANY_ADDED,
  LOGO_ATTACHED,
  BIG_LOGO_ATTACHED
} from "../../actions/company-actions";
import {
  SPONSORED_PROJECT_SPONSORSHIP_TYPE_SUPPORTING_COMPANY_DELETED,
  SPONSORED_PROJECT_SPONSORSHIP_TYPE_SUPPORTING_COMPANY_ADDED
} from "../../actions/sponsored-project-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  name: "",
  description: "",
  overview: "",
  url: "",
  display_on_site: false,
  featured: false,
  city: "",
  state: "",
  country: "",
  industry: "",
  products: "",
  contributions: "",
  contact_email: "",
  member_level: "None",
  admin_email: "",
  commitment: "",
  commitment_author: "",
  logo: "",
  big_logo: "",
  color: "",
  project_sponsorships: []
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {},
  sponsored_projects: []
};

const companyReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      // we need this in ce the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case RESET_COMPANY_FORM:
      return DEFAULT_STATE;
    case UPDATE_COMPANY:
      return { ...state, entity: { ...payload }, errors: {} };
    case COMPANY_ADDED:
    case RECEIVE_COMPANY: {
      const entity = { ...payload.response };
      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      return {
        ...state,
        entity: { ...DEFAULT_ENTITY, ...entity },
        errors: {}
      };
    }
    case LOGO_ATTACHED: {
      const logo = `${state.entity.logo}?${new Date().getTime()}`;
      return { ...state, entity: { ...state.entity, logo } };
    }
    case BIG_LOGO_ATTACHED: {
      const logo = `${state.entity.big_logo}?${new Date().getTime()}`;
      return { ...state, entity: { ...state.entity, big_logo: logo } };
    }
    case COMPANY_UPDATED:
      return state;
    case VALIDATE:
      return { ...state, errors: payload.errors };
    case SPONSORED_PROJECT_SPONSORSHIP_TYPE_SUPPORTING_COMPANY_DELETED: {
      let { project_sponsorships } = state.entity;
      const f = project_sponsorships.find((ps) => {
        const e = ps.supporting_companies.find(
          (sp) => sp.id == payload.supportingCompanyId
        );
        return e;
      });
      project_sponsorships = project_sponsorships.filter((e) => e.id != f.id);
      return {
        ...state,
        entity: { ...state.entity, project_sponsorships }
      };
    }
    case SPONSORED_PROJECT_SPONSORSHIP_TYPE_SUPPORTING_COMPANY_ADDED: {
      const entity = { ...payload.response };
      const { project_sponsorships } = entity.company;
      return {
        ...state,
        entity: { ...state.entity, project_sponsorships }
      };
    }
    default:
      return state;
  }
};

export default companyReducer;
