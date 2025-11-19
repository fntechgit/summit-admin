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
  REQUEST_PAYMENT_FEE_TYPES,
  RECEIVE_PAYMENT_FEE_TYPES,
  PAYMENT_FEE_TYPE_DELETED
} from "../../actions/ticket-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  paymentFeeTypes: [],
  order: "id",
  orderDir: 1,
  totalPaymentFeeTypes: 0
};

const paymentFeeTypesListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_PAYMENT_FEE_TYPES: {
      const { order, orderDir } = payload;
      return { ...state, order, orderDir };
    }
    case RECEIVE_PAYMENT_FEE_TYPES: {
      const { total, data } = payload.response;
      return {
        ...state,
        paymentFeeTypes: data,
        totalPaymentFeeTypes: total
      };
    }
    case PAYMENT_FEE_TYPE_DELETED: {
      const { paymentFeeTypeId } = payload;
      return {
        ...state,
        paymentFeeTypes: state.paymentFeeTypes.filter(
          (pft) => pft.id !== paymentFeeTypeId
        ),
        totalPaymentFeeTypes: state.totalPaymentFeeTypes - 1
      };
    }
    default:
      return state;
  }
};

export default paymentFeeTypesListReducer;
