import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import dropboxSyncReducer from "../locations/dropbox-sync-reducer";
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

describe("dropboxSyncReducer", () => {
  test("returns default state for unknown action", () => {
    const state = dropboxSyncReducer(undefined, { type: "UNKNOWN" });
    expect(state).toEqual(DEFAULT_STATE);
  });

  test("REQUEST_SYNC_CONFIG sets loading to true", () => {
    const state = dropboxSyncReducer(DEFAULT_STATE, {
      type: REQUEST_SYNC_CONFIG
    });
    expect(state.loading).toBe(true);
  });

  test("RECEIVE_SYNC_CONFIG sets config and loading to false", () => {
    const prevState = { ...DEFAULT_STATE, loading: true };
    const payload = {
      response: {
        summit_id: 1,
        dropbox_sync_enabled: true,
        preflight_alert_email: "test@example.com"
      }
    };

    const state = dropboxSyncReducer(prevState, {
      type: RECEIVE_SYNC_CONFIG,
      payload
    });

    expect(state.syncConfig).toEqual(payload.response);
    expect(state.loading).toBe(false);
  });

  test("SYNC_CONFIG_UPDATED sets config and loading to false", () => {
    const prevState = { ...DEFAULT_STATE, loading: true };
    const payload = {
      response: {
        summit_id: 1,
        dropbox_sync_enabled: false,
        preflight_alert_email: "updated@example.com"
      }
    };

    const state = dropboxSyncReducer(prevState, {
      type: SYNC_CONFIG_UPDATED,
      payload
    });

    expect(state.syncConfig).toEqual(payload.response);
    expect(state.loading).toBe(false);
  });

  test("SET_CURRENT_SUMMIT resets to default state", () => {
    const prevState = {
      syncConfig: {
        summit_id: 1,
        dropbox_sync_enabled: true,
        preflight_alert_email: "test@example.com"
      },
      loading: true
    };

    const state = dropboxSyncReducer(prevState, {
      type: SET_CURRENT_SUMMIT,
      payload: {}
    });

    expect(state).toEqual(DEFAULT_STATE);
  });

  test("LOGOUT_USER resets to default state", () => {
    const prevState = {
      syncConfig: {
        summit_id: 1,
        dropbox_sync_enabled: true,
        preflight_alert_email: "test@example.com"
      },
      loading: true
    };

    const state = dropboxSyncReducer(prevState, {
      type: LOGOUT_USER,
      payload: {}
    });

    expect(state).toEqual(DEFAULT_STATE);
  });

  // regression pins — must pass before AND after implementation
  test("RECEIVE_SYNC_CONFIG populates materialized_media_upload_types when present in response", () => {
    const payload = {
      response: {
        summit_id: 1,
        dropbox_sync_enabled: true,
        preflight_alert_email: "test@example.com",
        materialized_media_upload_types: [
          { id: 1, name: "Video", private_storage_type: "dropbox" }
        ]
      }
    };

    const state = dropboxSyncReducer(DEFAULT_STATE, {
      type: RECEIVE_SYNC_CONFIG,
      payload
    });

    expect(state.syncConfig.materialized_media_upload_types).toEqual([
      { id: 1, name: "Video", private_storage_type: "dropbox" }
    ]);
  });

  test("SYNC_CONFIG_UPDATED populates materialized_media_upload_types when present in response", () => {
    const payload = {
      response: {
        summit_id: 1,
        dropbox_sync_enabled: false,
        preflight_alert_email: "test@example.com",
        materialized_media_upload_types: [
          { id: 2, name: "Image", private_storage_type: "local" }
        ]
      }
    };

    const state = dropboxSyncReducer(DEFAULT_STATE, {
      type: SYNC_CONFIG_UPDATED,
      payload
    });

    expect(state.syncConfig.materialized_media_upload_types).toEqual([
      { id: 2, name: "Image", private_storage_type: "local" }
    ]);
  });

  // allowlist action tests
  test("REQUEST_ALLOWLIST_OPTIONS resets allowlistOptions and leaves syncConfig untouched", () => {
    const prevState = {
      ...DEFAULT_STATE,
      syncConfig: { ...DEFAULT_STATE.syncConfig, dropbox_sync_enabled: true },
      allowlistOptions: {
        options: [{ id: 1, name: "Video", private_storage_type: "dropbox" }],
        error: null
      }
    };

    const state = dropboxSyncReducer(prevState, {
      type: REQUEST_ALLOWLIST_OPTIONS,
      payload: {}
    });

    expect(state.allowlistOptions).toEqual({ options: [], error: null });
    expect(state.syncConfig.dropbox_sync_enabled).toBe(true);
  });

  test("RECEIVE_ALLOWLIST_OPTIONS sets options array and clears error", () => {
    const options = [
      { id: 1, name: "Video", private_storage_type: "dropbox" },
      { id: 2, name: "Image", private_storage_type: "local" }
    ];

    const state = dropboxSyncReducer(DEFAULT_STATE, {
      type: RECEIVE_ALLOWLIST_OPTIONS,
      payload: options
    });

    expect(state.allowlistOptions).toEqual({ options, error: null });
  });

  test("ALLOWLIST_OPTIONS_ERROR clears options and sets error message", () => {
    const prevState = {
      ...DEFAULT_STATE,
      allowlistOptions: {
        options: [{ id: 1, name: "Video", private_storage_type: "dropbox" }],
        error: null
      }
    };

    const state = dropboxSyncReducer(prevState, {
      type: ALLOWLIST_OPTIONS_ERROR,
      payload: "fetch failed"
    });

    expect(state.allowlistOptions).toEqual({
      options: [],
      error: "fetch failed"
    });
  });
});
