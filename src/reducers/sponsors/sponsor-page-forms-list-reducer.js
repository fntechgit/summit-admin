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
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  REQUEST_SPONSOR_MANAGED_FORMS,
  RECEIVE_SPONSOR_MANAGED_FORMS,
  SPONSOR_MANAGED_FORMS_ADDED,
  RECEIVE_SPONSOR_CUSTOMIZED_FORMS,
  REQUEST_SPONSOR_CUSTOMIZED_FORMS,
  SPONSOR_CUSTOMIZED_FORM_ADDED,
  SPONSOR_CUSTOMIZED_FORM_DELETED,
  SPONSOR_CUSTOMIZED_FORM_ARCHIVED_CHANGED,
  SPONSOR_CUSTOMIZED_FORM_UPDATED
} from "../../actions/sponsor-forms-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

export const DEFAULT_STATE = {
  managedForms: {
    forms: [],
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalCount: 0
  },
  customizedForms: {
    forms: [],
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalCount: 0
  },
  term: "",
  hideArchived: false,
  summitTZ: ""
};

const sponsorPageFormsListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_MANAGED_FORMS: {
      const { order, orderDir, page, term, summitTZ, hideArchived } = payload;

      return {
        ...state,
        managedForms: {
          ...state.managedForms,
          order,
          orderDir,
          forms: [],
          currentPage: page
        },
        term,
        summitTZ,
        hideArchived
      };
    }
    case REQUEST_SPONSOR_CUSTOMIZED_FORMS: {
      const { order, orderDir, page, term, summitTZ, hideArchived } = payload;

      return {
        ...state,
        customizedForms: {
          ...state.customizedForms,
          order,
          orderDir,
          forms: [],
          currentPage: page
        },
        term,
        summitTZ,
        hideArchived
      };
    }
    case RECEIVE_SPONSOR_MANAGED_FORMS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const forms = payload.response.data.map((a) => {
        const opensAt = a.opens_at
          ? epochToMomentTimeZone(a.opens_at, state.summitTZ)?.format(
              "YYYY/MM/DD"
            )
          : "N/A";
        const expiresAt = a.expires_at
          ? epochToMomentTimeZone(a.expires_at, state.summitTZ)?.format(
              "YYYY/MM/DD"
            )
          : "N/A";

        return {
          id: a.id,
          code: a.code,
          name: a.name,
          items_count: a.items_count,
          allowed_add_ons: a.allowed_add_ons,
          is_archived: a.is_archived,
          opens_at: opensAt,
          expires_at: expiresAt
        };
      });

      return {
        ...state,
        managedForms: {
          ...state.managedForms,
          forms,
          currentPage,
          totalCount: total,
          lastPage
        }
      };
    }
    case RECEIVE_SPONSOR_CUSTOMIZED_FORMS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const forms = payload.response.data.map((a) => {
        const opensAt = a.opens_at
          ? epochToMomentTimeZone(a.opens_at, state.summitTZ)?.format(
              "YYYY/MM/DD"
            )
          : "N/A";
        const expiresAt = a.expires_at
          ? epochToMomentTimeZone(a.expires_at, state.summitTZ)?.format(
              "YYYY/MM/DD"
            )
          : "N/A";

        return {
          id: a.id,
          code: a.code,
          name: a.name,
          items_count: a.items_count || 0,
          allowed_add_ons: a.allowed_add_ons,
          is_archived: a.is_archived,
          opens_at: opensAt,
          expires_at: expiresAt
        };
      });

      return {
        ...state,
        customizedForms: {
          ...state.customizedForms,
          forms,
          currentPage,
          totalCount: total,
          lastPage
        }
      };
    }
    case SPONSOR_MANAGED_FORMS_ADDED: {
      const newForm = payload.response;

      newForm.opens_at = payload.response.opens_at
        ? epochToMomentTimeZone(
            payload.response.opens_at,
            state.summitTZ
          )?.format("YYYY/MM/DD")
        : "N/A";
      newForm.expires_at = payload.response.expires_at
        ? epochToMomentTimeZone(
            payload.response.expires_at,
            state.summitTZ
          )?.format("YYYY/MM/DD")
        : "N/A";

      return {
        ...state,
        managedForms: {
          ...state.managedForms,
          forms: [...state.managedForms.forms, newForm],
          totalCount: state.managedForms.totalCount + 1
        }
      };
    }
    case SPONSOR_CUSTOMIZED_FORM_ADDED: {
      const newForm = payload.response;

      newForm.opens_at = payload.response.opens_at
        ? epochToMomentTimeZone(
            payload.response.opens_at,
            state.summitTZ
          )?.format("YYYY/MM/DD")
        : "N/A";
      newForm.expires_at = payload.response.expires_at
        ? epochToMomentTimeZone(
            payload.response.expires_at,
            state.summitTZ
          )?.format("YYYY/MM/DD")
        : "N/A";

      return {
        ...state,
        customizedForms: {
          ...state.customizedForms,
          forms: [...state.customizedForms.forms, newForm],
          totalCount: state.customizedForms.totalCount + 1
        }
      };
    }
    case SPONSOR_CUSTOMIZED_FORM_UPDATED: {
      const newForm = payload.response;

      newForm.opens_at = payload.response.opens_at
        ? epochToMomentTimeZone(
            payload.response.opens_at,
            state.summitTZ
          )?.format("YYYY/MM/DD")
        : "N/A";
      newForm.expires_at = payload.response.expires_at
        ? epochToMomentTimeZone(
            payload.response.expires_at,
            state.summitTZ
          )?.format("YYYY/MM/DD")
        : "N/A";

      const forms = state.customizedForms.forms.map((form) => {
        if (form.id === newForm.id) {
          return newForm;
        }
        return form;
      });

      return {
        ...state,
        customizedForms: {
          ...state.customizedForms,
          forms
        }
      };
    }
    case SPONSOR_CUSTOMIZED_FORM_ARCHIVED_CHANGED: {
      const { formId, isArchived } = payload;
      const forms = state.customizedForms.forms.map((form) => {
        if (form.id === formId) {
          return {
            ...form,
            is_archived: isArchived
          };
        }
        return form;
      });

      return {
        ...state,
        customizedForms: {
          ...state.customizedForms,
          forms
        }
      };
    }
    case SPONSOR_CUSTOMIZED_FORM_DELETED: {
      const { formId } = payload;
      const forms = state.customizedForms.forms.filter(
        (form) => form.id !== formId
      );

      return {
        ...state,
        customizedForms: {
          ...state.customizedForms,
          forms,
          totalCount: state.customizedForms.totalCount - 1
        }
      };
    }
    default:
      return state;
  }
};

export default sponsorPageFormsListReducer;
