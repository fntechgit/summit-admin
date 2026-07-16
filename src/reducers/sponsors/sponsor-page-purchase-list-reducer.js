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

import moment from "moment-timezone";
import { amountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  CLEAR_SPONSOR_ORDER,
  RECEIVE_SPONSOR_ORDER,
  RECEIVE_SPONSOR_PURCHASES,
  REQUEST_SPONSOR_PURCHASES,
  SPONSOR_CLIENT_ADDRESS_UPDATED,
  SPONSOR_CLIENT_UPDATED,
  SPONSOR_PURCHASE_STATUS_UPDATED
} from "../../actions/sponsor-purchases-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  MILLISECONDS_TO_SECONDS,
  PURCHASE_STATUS
} from "../../utils/constants";
import { normalizeOrder } from "../../pages/sponsors/sponsor-page/utils";

const DEFAULT_STATE = {
  purchases: [],
  order: "created",
  orderDir: -1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  term: "",
  currentOrder: null
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
        amount: `$${amountFromCents(a.net_amount)}`,
        purchased: a.purchased_date
          ? moment(a.purchased_date * MILLISECONDS_TO_SECONDS).format(
              "YYYY/MM/DD HH:mm a"
            )
          : PURCHASE_STATUS.PENDING
      }));

      return {
        ...state,
        purchases,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    case SPONSOR_PURCHASE_STATUS_UPDATED: {
      const { paymentId, status } = payload;
      const purchases = state.purchases.map((p) => {
        if (p.payment_id === paymentId) return { ...p, status };
        return p;
      });

      return { ...state, purchases };
    }
    case RECEIVE_SPONSOR_ORDER: {
      const data = payload.response;
      const currentOrder = normalizeOrder(data);

      return { ...state, currentOrder };
    }
    case CLEAR_SPONSOR_ORDER: {
      return { ...state, currentOrder: null };
    }
    case SPONSOR_CLIENT_UPDATED: {
      const client = payload.response;
      return { ...state, currentOrder: { ...state.currentOrder, client } };
    }
    case SPONSOR_CLIENT_ADDRESS_UPDATED: {
      const address = payload.response;
      return { ...state, currentOrder: { ...state.currentOrder, address } };
    }
    default:
      return state;
  }
};

export default sponsorPagePurchaseListReducer;
