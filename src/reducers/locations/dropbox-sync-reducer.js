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
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  REQUEST_SYNC_CONFIG,
  RECEIVE_SYNC_CONFIG,
  SYNC_CONFIG_UPDATED,
  REQUEST_ALLOWLIST_OPTIONS,
  RECEIVE_ALLOWLIST_OPTIONS,
  ALLOWLIST_OPTIONS_ERROR
} from "../../actions/dropbox-sync-actions";

const DEFAULT_STATE = {
  syncConfig: {
    summit_id: null,
    dropbox_sync_enabled: false,
    preflight_alert_email: null,
    materialized_media_upload_types: []
  },
  allowlistOptions: { options: [], error: null },
  loading: false
};

const dropboxSyncReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case REQUEST_SYNC_CONFIG:
      return { ...state, loading: true };
    case RECEIVE_SYNC_CONFIG:
      return {
        ...state,
        syncConfig: payload.response ?? DEFAULT_STATE.syncConfig,
        loading: false
      };
    case SYNC_CONFIG_UPDATED:
      return {
        ...state,
        syncConfig: payload.response ?? DEFAULT_STATE.syncConfig,
        loading: false
      };
    case REQUEST_ALLOWLIST_OPTIONS:
      return { ...state, allowlistOptions: { options: [], error: null } };
    case RECEIVE_ALLOWLIST_OPTIONS:
      return { ...state, allowlistOptions: { options: payload, error: null } };
    case ALLOWLIST_OPTIONS_ERROR:
      return { ...state, allowlistOptions: { options: [], error: payload } };
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER:
      return { ...DEFAULT_STATE };
    default:
      return state;
  }
};

export default dropboxSyncReducer;
