import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import dropboxSyncReducer from "../locations/dropbox-sync-reducer";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  REQUEST_SYNC_CONFIG,
  RECEIVE_SYNC_CONFIG,
  SYNC_CONFIG_UPDATED
} from "../../actions/dropbox-sync-actions";

const DEFAULT_STATE = {
  syncConfig: {
    summit_id: null,
    dropbox_sync_enabled: false,
    preflight_alert_email: null
  },
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
});
