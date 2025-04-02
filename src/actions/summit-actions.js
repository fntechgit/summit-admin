/**
 * Copyright 2018 OpenStack Foundation
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
import Swal from "sweetalert2";
import T from "i18n-react/dist/i18n-react";
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  showSuccessMessage,
  authErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  DEFAULT_CURRENT_PAGE,
  DUMMY_ACTION,
  DEFAULT_PER_PAGE,
  ERROR_CODE_404
} from "../utils/constants";
import { getAccessTokenSafely } from "../utils/methods";
import { saveMarketingSetting } from "./marketing-actions";
import { normalizeLeadReportSettings } from "../models/lead-report-settings";

export const REQUEST_SUMMIT = "REQUEST_SUMMIT";
export const RECEIVE_SUMMIT = "RECEIVE_SUMMIT";
export const REQUEST_SUMMITS = "REQUEST_SUMMITS";
export const RECEIVE_SUMMITS = "RECEIVE_SUMMITS";
export const SET_CURRENT_SUMMIT = "SET_CURRENT_SUMMIT";
export const RESET_SUMMIT_FORM = "RESET_SUMMIT_FORM";
export const UPDATE_SUMMIT = "UPDATE_SUMMIT";
export const SUMMIT_UPDATED = "SUMMIT_UPDATED";
export const SUMMIT_ADDED = "SUMMIT_ADDED";
export const SUMMIT_DELETED = "SUMMIT_DELETED";
export const SUMMIT_LOGO_ATTACHED = "SUMMIT_LOGO_ATTACHED";
export const SUMMIT_LOGO_DELETED = "SUMMIT_LOGO_DELETED";
export const CLEAR_SUMMIT = "CLEAR_SUMMIT";
export const REGISTRATION_KEY_GENERATED = "REGISTRATION_KEY_GENERATED";
export const RECEIVE_LEAD_REPORT_SETTINGS_META =
  "RECEIVE_LEAD_REPORT_SETTINGS_META";
export const LEAD_REPORT_SETTINGS_UPDATED = "LEAD_REPORT_SETTINGS_UPDATED";

export const getSummitById = (summitId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand:
      "event_types," +
      "tracks," +
      "track_groups," +
      "locations," +
      "locations.rooms," +
      "locations.rooms.floor," +
      "meeting_booking_room_allowed_attributes," +
      "meeting_booking_room_allowed_attributes.values," +
      "lead_report_settings," +
      "presentation_action_types," +
      "selection_plans,selection_plans.track_groups," +
      "ticket_types," +
      "badge_types," +
      "badge_features," +
      "badge_features_types," +
      "badge_access_level_types," +
      "badge_view_types",
    fields:
      "id," +
      "name," +
      "active," +
      "allow_update_attendee_extra_questions," +
      "available_on_api," +
      "calendar_sync_desc," +
      "calendar_sync_name," +
      "dates_label," +
      "end_date," +
      "event_types,event_types.id,event_types.name,event_types.order,event_types.allows_attachment,event_types.allows_level,event_types.allows_location,event_types.allows_location_timeframe_collision,event_types.allows_publishing_dates," +
      "link," +
      "locations,locations.id,locations.name,locations.order,locations.class_name,locations.rooms.id,locations.rooms.name,locations.rooms.floor.id,locations.rooms.floor.name," +
      "logo," +
      "secondary_logo," +
      "presentation_voters_count," +
      "presentation_votes_count," +
      "presentations_submitted_count," +
      "published_events_count," +
      "reassign_ticket_till_date," +
      "registration_begin_date," +
      "registration_end_date," +
      "registration_link," +
      "registration_disclaimer_content," +
      "registration_disclaimer_mandatory," +
      "registration_slug_prefix," +
      "schedule_start_date," +
      "secondary_registration_label," +
      "secondary_registration_link," +
      "speaker_announcement_email_accepted_alternate_count," +
      "speaker_announcement_email_accepted_count," +
      "speaker_announcement_email_accepted_rejected_count," +
      "speaker_announcement_email_alternate_count," +
      "speaker_announcement_email_alternate_rejected_count," +
      "speaker_announcement_email_rejected_count," +
      "speakers_count," +
      "start_date," +
      "start_showing_venues_date," +
      "slug," +
      "supported_currencies," +
      "default_ticket_type_currency," +
      "ticket_types,ticket_types.id,ticket_types.name," +
      "time_zone_id," +
      "time_zone_label," +
      "tracks,tracks.id,tracks.name,tracks.parent_id,tracks.order,tracks.chair_visible,tracks.subtracks,tracks.track_groups," +
      "selection_plans,selection_plans.id,selection_plans.name,selection_plans.is_enabled,selection_plans.order,selection_plans.submission_begin_date,selection_plans.submission_end_date,selection_plans.voting_begin_date,selection_plans.voting_end_date,selection_plans.selection_begin_date,selection_plans.selection_end_date,selection_plans.track_groups,selection_plans.allowed_presentation_questions," +
      "meeting_booking_room_allowed_attributes,meeting_booking_room_allowed_attributes.id,meeting_booking_room_allowed_attributes.created,meeting_booking_room_allowed_attributes.last_edited,meeting_booking_room_allowed_attributes.type,meeting_booking_room_allowed_attributes.summit_id,meeting_booking_room_allowed_attributes.values.value," +
      "meeting_room_booking_end_time," +
      "meeting_room_booking_max_allowed," +
      "meeting_room_booking_slot_length," +
      "meeting_room_booking_start_time," +
      "api_feed_type," +
      "api_feed_url," +
      "api_feed_key," +
      "badge_access_level_types,badge_access_level_types.id,badge_access_level_types.name," +
      "badge_types,badge_types.id,badge_types.name,badge_types.allowed_view_types," +
      "badge_features," +
      "badge_view_types,badge_view_types.id,badge_view_types.name," +
      "order_extra_questions," +
      "begin_allow_booking_date," +
      "end_allow_booking_date," +
      "external_summit_id," +
      "external_registration_feed_type," +
      "external_registration_feed_api_key," +
      "virtual_site_url," +
      "marketing_site_url," +
      "mux_token_id," +
      "mux_token_secret," +
      "mux_allowed_domains,mux_allowed_domains.label,mux_allowed_domains.value," +
      "help_users," +
      "registration_send_qr_as_image_attachment_on_ticket_email," +
      "registration_send_ticket_as_pdf_attachment_on_ticket_email," +
      "registration_allow_automatic_reminder_emails," +
      "registration_send_order_email_automatically," +
      "qr_codes_enc_key," +
      "speaker_confirmation_default_page_url," +
      "marketing_site_oauth2_client_id," +
      "marketing_site_oauth2_client_scopes," +
      "available_lead_report_columns," +
      "created," +
      "last_edited," +
      "invite_only_registration," +
      "registration_reminder_email_days_interval," +
      "support_email," +
      "speakers_support_email," +
      "registration_send_ticket_email_automatically," +
      "registration_allowed_refund_request_till_date," +
      "default_ticket_type_currency_symbol," +
      "virtual_site_oauth2_client_id," +
      "paid_tickets_count," +
      "track_groups,track_groups.id,track_groups.name," +
      "lead_report_settings,lead_report_settings.sponsor_id,lead_report_settings.columns," +
      "presentation_action_types,presentation_action_types.id,presentation_action_types.label," +
      "badge_features_types,badge_features_types.id,badge_features_types.name," +
      "",
    relations:
      "event_types.none," +
      "tracks.subtracks,tracks.track_groups," +
      "tracks_groups.none," +
      "locations,locations.rooms,locations.rooms.none,locations.floor,locations.none," +
      "meeting_booking_room_allowed_attributes.values," +
      "selection_plans.track_groups,selection_plans.allowed_presentation_questions," +
      "ticket_types.none," +
      "badge_types.none," +
      "none"
  };

  // set id
  dispatch(createAction(REQUEST_SUMMIT)({ id: summitId }));

  return getRequest(
    null,
    createAction(RECEIVE_SUMMIT),
    `${window.API_BASE_URL}/api/v2/summits/${summitId}`,
    (err, res) => (dispatch, state) => {
      const code = err.status;
      let msg = "";
      dispatch(stopLoading());
      switch (code) {
        case ERROR_CODE_404:
          msg = "";
          if (err.response.body && err.response.body.message)
            msg = err.response.body.message;
          else if (err.response.error && err.response.error.message)
            msg = err.response.error.message;
          else msg = err.message;
          Swal.fire("Not Found", msg, "warning");
          // reset id
          dispatch(createAction(CLEAR_SUMMIT)({}));
          break;
        default:
          authErrorHandler(err, res)(dispatch, state);
      }
    }
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const clearCurrentSummit = () => (dispatch) => {
  dispatch(createAction(RESET_SUMMIT_FORM)({}));
};

export const loadSummits =
  (page = DEFAULT_CURRENT_PAGE, perPage = DEFAULT_PER_PAGE) =>
  async (dispatch, getState) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      fields: "id,name,start_date,end_date,invite_only_registration",
      expand: "none",
      relations: "none",
      page,
      per_page: perPage,
      order: "-start_date"
    };

    getRequest(
      createAction(REQUEST_SUMMITS),
      createAction(RECEIVE_SUMMITS),
      `${window.API_BASE_URL}/api/v1/summits/all`,
      authErrorHandler
    )(params)(dispatch, getState).then(() => {
      dispatch(stopLoading());
    });
  };

export const resetSummitForm = () => (dispatch) => {
  dispatch(createAction(RESET_SUMMIT_FORM)({}));
};

export const saveSummit = (entity) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);

  const params = {
    access_token: accessToken
  };

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_SUMMIT),
      createAction(SUMMIT_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(showSuccessMessage(T.translate("edit_summit.summit_saved")));
      return payload;
    });
  }

  return postRequest(
    createAction(UPDATE_SUMMIT),
    createAction(SUMMIT_ADDED),
    `${window.API_BASE_URL}/api/v1/summits`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch).then((payload) => {
    dispatch(showSuccessMessage(T.translate("edit_summit.summit_created")));
    return payload;
  });
};

export const deleteSummit = (summitId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(SUMMIT_DELETED)({ summitId }),
    `${window.API_BASE_URL}/api/v1/summits/${summitId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const attachLogo =
  (entity, file, secondary = false) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    const normalizedEntity = normalizeEntity(entity);

    if (entity.id) {
      dispatch(uploadLogo(entity, file, secondary));
    } else {
      return postRequest(
        createAction(UPDATE_SUMMIT),
        createAction(SUMMIT_ADDED),
        `${window.API_BASE_URL}/api/v1/summits`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then((payload) => {
        dispatch(uploadLogo(payload.response, file, secondary));
      });
    }
  };

const uploadLogo = (entity, file, secondary) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const url = `${window.API_BASE_URL}/api/v1/summits/${entity.id}/logo${
    secondary ? "/secondary" : ""
  }`;
  const params = {
    access_token: accessToken
  };

  return postRequest(
    null,
    createAction(DUMMY_ACTION),
    url,
    file,
    authErrorHandler
  )(params)(dispatch).then(({ response }) => {
    const payload = {};
    if (secondary) payload.secondary_logo = response.url;
    else payload.logo = response.url;

    dispatch(createAction(SUMMIT_LOGO_ATTACHED)(payload));
    dispatch(stopLoading());
  });
};

export const deleteLogo = (secondary) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const url = `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/logo${
    secondary ? "/secondary" : ""
  }`;
  const payload = {};
  if (secondary) payload.secondary_logo = null;
  else payload.logo = null;

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(SUMMIT_LOGO_DELETED)(payload),
    url,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

/**
 * @param regLiteMarketingSettings
 * @returns {function(*, *): Promise<unknown[]>}
 */
export const saveRegistrationLiteMarketingSettings =
  (regLiteMarketingSettings) => async (dispatch) =>
    Promise.all(
      Object.keys(regLiteMarketingSettings).map((m) => {
        const setting_type = "TEXT";
        let value = regLiteMarketingSettings[m].value ?? "";

        if (typeof value === "boolean") {
          value = value ? "1" : "0";
        }

        const mkt_setting = {
          id: regLiteMarketingSettings[m].id,
          type: setting_type,
          key: m.toUpperCase(),
          value
        };

        return dispatch(saveMarketingSetting(mkt_setting));
      })
    );

/**
 * @param regLiteMarketingSettings
 * @returns {function(*, *): Promise<unknown[]>}
 */
export const savePrintAppMarketingSettings =
  (printAppMarketingSettings) => async (dispatch) =>
    Promise.all(
      Object.keys(printAppMarketingSettings).map((m) => {
        const setting_type = "TEXT";
        let value = printAppMarketingSettings[m].value ?? "";

        if (typeof value === "boolean") {
          value = value ? "1" : "0";
        }

        const mkt_setting = {
          id: printAppMarketingSettings[m].id,
          type: setting_type,
          key: m.toUpperCase(),
          value
        };

        return dispatch(saveMarketingSetting(mkt_setting));
      })
    );

/**
 * @returns {function(*, *): Promise<unknown[]>}
 */
export const generateEncryptionKey = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  putRequest(
    null,
    createAction(REGISTRATION_KEY_GENERATED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/qr-codes/all/enc-key`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

/** ****************  LEAD REPORT SETTINGS  *************************************** */

export const getLeadReportSettingsMeta = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  return getRequest(
    null,
    createAction(RECEIVE_LEAD_REPORT_SETTINGS_META),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/lead-report-settings/metadata`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const upsertLeadReportSettings =
  (allowed_columns) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = { access_token: accessToken };

    const settings = {
      allowed_columns: normalizeLeadReportSettings(allowed_columns)
    };

    putRequest(
      null,
      createAction(LEAD_REPORT_SETTINGS_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/lead-report-settings`,
      settings,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  delete normalizedEntity.id;
  delete normalizedEntity.created;
  delete normalizedEntity.last_edited;
  delete normalizedEntity.logo;
  delete normalizedEntity.attendees_count;
  delete normalizedEntity.event_types;
  delete normalizedEntity.locations;
  delete normalizedEntity.max_submission_allowed_per_user;
  delete normalizedEntity.page_url;
  delete normalizedEntity.presentation_voters_count;
  delete normalizedEntity.presentation_votes_count;
  delete normalizedEntity.presentations_submitted_count;
  delete normalizedEntity.published_events_count;
  delete normalizedEntity.schedule_event_detail_url;
  delete normalizedEntity.schedule_page_url;
  delete normalizedEntity.speaker_announcement_email_accepted_alternate_count;
  delete normalizedEntity.speaker_announcement_email_accepted_count;
  delete normalizedEntity.speaker_announcement_email_accepted_rejected_count;
  delete normalizedEntity.speaker_announcement_email_alternate_count;
  delete normalizedEntity.speaker_announcement_email_alternate_rejected_count;
  delete normalizedEntity.speaker_announcement_email_rejected_count;
  delete normalizedEntity.speakers_count;
  delete normalizedEntity.ticket_types;
  delete normalizedEntity.time_zone;
  delete normalizedEntity.timestamp;
  delete normalizedEntity.tracks;
  delete normalizedEntity.wifi_connections;
  delete normalizedEntity.qr_codes_enc_key;

  if (!normalizedEntity.registration_allowed_refund_request_till_date)
    normalizedEntity.registration_allowed_refund_request_till_date = null;
  if (!normalizedEntity.registration_begin_date)
    normalizedEntity.registration_begin_date = null;
  if (!normalizedEntity.registration_end_date)
    normalizedEntity.registration_end_date = null;
  if (!normalizedEntity.schedule_start_date)
    normalizedEntity.schedule_start_date = null;
  if (!normalizedEntity.start_showing_venues_date)
    normalizedEntity.start_showing_venues_date = null;
  if (!normalizedEntity.start_date) normalizedEntity.start_date = null;
  if (!normalizedEntity.end_date) normalizedEntity.end_date = null;

  if (!normalizedEntity.meeting_room_booking_max_allowed)
    delete normalizedEntity.meeting_room_booking_max_allowed;

  if (!normalizedEntity.meeting_room_booking_slot_length)
    delete normalizedEntity.meeting_room_booking_slot_length;

  if (normalizedEntity.api_feed_type === "none")
    normalizedEntity.api_feed_type = "";

  if (normalizedEntity.external_registration_feed_type === "none")
    normalizedEntity.external_registration_feed_type = "";

  if (normalizedEntity.mux_allowed_domains) {
    normalizedEntity.mux_allowed_domains =
      normalizedEntity.mux_allowed_domains.map((e) => e.value);
  }
  return normalizedEntity;
};
