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
  RECEIVE_SPONSOR_FORM_ITEMS,
  REQUEST_SPONSOR_FORM_ITEMS
} from "../../actions/sponsor-forms-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { DECIMAL_DIGITS } from "../../utils/constants";

const DEFAULT_STATE = {
  items: [],
  term: "",
  hideArchived: false,
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0
};

const sponsorFormItemsListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_FORM_ITEMS: {
      const { order, orderDir, page, term, hideArchived } = payload;

      return {
        ...state,
        order,
        orderDir,
        items: [],
        currentPage: page,
        term,
        hideArchived
      };
    }
    case RECEIVE_SPONSOR_FORM_ITEMS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const items = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        early_bird_rate: `$${a.early_bird_rate.toFixed(DECIMAL_DIGITS)}`,
        standard_rate: `$${a.standard_rate.toFixed(DECIMAL_DIGITS)}`,
        onsite_rate: `$${a.onsite_rate.toFixed(DECIMAL_DIGITS)}`,
        default_quantity: a.default_quantity,
        is_archived: a.is_archived,
        images: a.images
      }));

      return {
        ...state,
        items,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    default:
      return state;
  }
};

export default sponsorFormItemsListReducer;
