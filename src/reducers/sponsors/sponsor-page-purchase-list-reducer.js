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

import moment from "moment-timezone";
import { amountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  REQUEST_SPONSOR_PURCHASES,
  RECEIVE_SPONSOR_PURCHASES
} from "../../actions/sponsor-purchases-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { MILLISECONDS } from "../../utils/constants";

const DEFAULT_STATE = {
  purchases: [],
  order: "order",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  term: ""
};

const sponsorPagePurchaseListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_PURCHASES: {
      const { order, orderDir, page, perPage, term } = payload;

      return {
        ...state,
        order,
        orderDir,
        forms: [],
        currentPage: page,
        perPage,
        term
      };
    }
    case RECEIVE_SPONSOR_PURCHASES: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const purchases = payload.response.data.map((a) => ({
          ...a,
          order: a.order_number,
          amount: `$${amountFromCents(a.raw_amount)}`,
          purchased: moment(a.created * MILLISECONDS).format(
            "YYYY/MM/DD HH:mm a"
          )
        }));

      return {
        ...state,
        purchases,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    default:
      return state;
  }
};

export default sponsorPagePurchaseListReducer;
