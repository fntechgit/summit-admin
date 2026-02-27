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
import {
  RECEIVE_PURCHASE_SPONSOR_SETTINGS,
  RECEIVE_USER_SPONSOR_SETTINGS,
  REQUEST_SPONSOR_SETTINGS,
  SET_EMPTY_PURCHASES_SETTINGS,
  SET_EMPTY_SPONSOR_USERS_SETTINGS,
  SPONSOR_USER_SETTINGS_UPDATED,
  SPONSOR_PURCHASE_SETTINGS_UPDATED
} from "../../actions/sponsor-settings-actions";
import {
  RECEIVE_SUMMIT,
  SET_CURRENT_SUMMIT
} from "../../actions/summit-actions";
import { arrayToString } from "../../utils/methods";

const DEFAULT_STATE = {
  settings: {
    early_bird_end_date: null,
    standard_price_end_date: null,
    onsite_price_start_date: null,
    onsite_price_end_date: null,
    wire_transfer_notification_email: "",
    access_request_notification_email: "",
    wire_transfer_detail: "",
    cart_checkout_cancel_policy: "",
    is_wire_transfer_enabled: false,
    is_access_request_enabled: false
  },
  emptyPurchaseSettings: false,
  emptySponsorUserSettings: false,
  summitTZ: "utc"
};

const sponsorSettingsReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }

      return { ...DEFAULT_STATE };
    }
    case SET_CURRENT_SUMMIT: {
      return { ...DEFAULT_STATE };
    }
    case RECEIVE_SUMMIT: {
      const entity = { ...payload.response };
      return { ...state, summitTZ: entity.time_zone_id };
    }
    case REQUEST_SPONSOR_SETTINGS: {
      return state;
    }
    case SET_EMPTY_SPONSOR_USERS_SETTINGS: {
      return { ...state, emptySponsorUserSettings: true };
    }
    case SET_EMPTY_PURCHASES_SETTINGS: {
      return { ...state, emptyPurchaseSettings: true };
    }
    case SPONSOR_PURCHASE_SETTINGS_UPDATED:
    case RECEIVE_PURCHASE_SPONSOR_SETTINGS: {
      const normalizedSettings = { ...payload.response };

      normalizedSettings.wire_transfer_notification_email = arrayToString(
        normalizedSettings.wire_transfer_notification_email,
        ";"
      );

      return {
        ...state,
        settings: { ...state.settings, ...normalizedSettings }
      };
    }
    case SPONSOR_USER_SETTINGS_UPDATED:
    case RECEIVE_USER_SPONSOR_SETTINGS: {
      const normalizedSettings = { ...payload.response };

      normalizedSettings.access_request_notification_email = arrayToString(
        normalizedSettings.access_request_notification_email,
        ";"
      );

      return {
        ...state,
        settings: { ...state.settings, ...normalizedSettings }
      };
    }
    default:
      return state;
  }
};

export default sponsorSettingsReducer;
