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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import T from "i18n-react/dist/i18n-react";
import {
  RECEIVE_SUMMITDOCS,
  REQUEST_SUMMITDOCS,
  SUMMITDOC_DELETED
} from "../../actions/summitdoc-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  summitDocs: [],
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalSummitDocs: 0
};

const summitDocListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SUMMITDOCS: {
      const { order, orderDir, term } = payload;

      return { ...state, order, orderDir, term };
    }
    case RECEIVE_SUMMITDOCS: {
      const {
        total: totalSummitDocs,
        last_page: lastPage,
        current_page: currentPage
      } = payload.response;
      const summitDocs = payload.response.data.map((s) => ({
        id: s.id,
        name: s.name,
        label: s.label,
        description: s.description,
        event_types_string: s.show_always
          ? T.translate("summitdoc.all_types")
          : s.event_types.map((et) => et.name).join(", "),
        selection_plan: s.selection_plan?.name
      }));

      return {
        ...state,
        summitDocs,
        currentPage,
        totalSummitDocs,
        lastPage
      };
    }
    case SUMMITDOC_DELETED: {
      const { summitDocId } = payload;
      return {
        ...state,
        summitDocs: state.summitDocs.filter((s) => s.id !== summitDocId)
      };
    }
    default:
      return state;
  }
};

export default summitDocListReducer;
