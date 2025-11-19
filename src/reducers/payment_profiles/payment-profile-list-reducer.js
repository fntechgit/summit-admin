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
  RECEIVE_PAYMENT_PROFILES,
  REQUEST_PAYMENT_PROFILES,
  PAYMENT_PROFILE_DELETED,
  PAYMENT_PROFILE_ADDED,
  PAYMENT_PROFILE_UPDATED
} from "../../actions/ticket-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  paymentProfiles: [],
  order: "id",
  orderDir: 1,
  totalPaymentProfiles: 0
};

const paymentProfileListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_PAYMENT_PROFILES: {
      const { order, orderDir } = payload;
      return { ...state, order, orderDir };
    }
    case RECEIVE_PAYMENT_PROFILES: {
      const { total } = payload.response;
      const paymentProfiles = payload.response.data;

      return {
        ...state,
        paymentProfiles,
        totalPaymentProfiles: total
      };
    }
    case PAYMENT_PROFILE_ADDED: {
      const { response } = payload;
      return {
        ...state,
        paymentProfiles: [...state.paymentProfiles, response],
        totalPaymentProfiles: state.totalPaymentProfiles + 1
      };
    }
    case PAYMENT_PROFILE_UPDATED: {
      const updatedEntity = { ...payload.response };
      const paymentProfiles = state.paymentProfiles.map((pp) => {
        if (pp.id === updatedEntity.id)
          return {
            ...updatedEntity
          };
        return pp;
      });

      return { ...state, paymentProfiles };
    }
    case PAYMENT_PROFILE_DELETED: {
      const { paymentProfileId } = payload;
      return {
        ...state,
        paymentProfiles: state.paymentProfiles.filter(
          (pp) => pp.id !== paymentProfileId
        ),
        totalPaymentProfiles: state.totalPaymentProfiles - 1
      };
    }
    default:
      return state;
  }
};

export default paymentProfileListReducer;
