import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  SET_CURRENT_SUMMIT,
  REQUEST_SUMMIT,
  RECEIVE_SUMMIT,
  UPDATE_SUMMIT,
  SUMMIT_ADDED,
  SUMMIT_UPDATED,
  RESET_SUMMIT_FORM,
  SUMMIT_LOGO_ATTACHED,
  SUMMIT_LOGO_DELETED,
  CLEAR_SUMMIT,
  REGISTRATION_KEY_GENERATED,
  RECEIVE_LEAD_REPORT_SETTINGS_META,
  LEAD_REPORT_SETTINGS_UPDATED
} from "../../actions/summit-actions";
import {
  EVENT_CATEGORY_UPDATED,
  EVENT_CATEGORY_ADDED,
  EVENT_CATEGORY_DELETED,
  EVENT_CATEGORIES_SEEDED,
  UNLINK_SUBTRACK
} from "../../actions/event-category-actions";
import {
  EVENT_TYPE_UPDATED,
  EVENT_TYPE_ADDED,
  EVENT_TYPE_DELETED,
  EVENT_TYPES_SEEDED
} from "../../actions/event-type-actions";
import {
  LOCATION_UPDATED,
  LOCATION_ADDED,
  LOCATION_DELETED,
  ROOM_ADDED,
  ROOM_DELETED
} from "../../actions/location-actions";

import {
  SELECTION_PLAN_DELETED,
  SELECTION_PLAN_ADDED,
  SELECTION_PLAN_UPDATED
} from "../../actions/selection-plan-actions";

import {
  ROOM_BOOKING_ATTRIBUTE_TYPE_DELETED,
  ROOM_BOOKING_ATTRIBUTE_TYPE_ADDED,
  ROOM_BOOKING_ATTRIBUTE_TYPE_UPDATED,
  ROOM_BOOKING_ATTRIBUTE_ADDED,
  ROOM_BOOKING_ATTRIBUTE_UPDATED,
  ROOM_BOOKING_ATTRIBUTE_DELETED
} from "../../actions/room-booking-actions";

import {
  RECEIVE_BADGE_TYPES,
  BADGE_TYPE_ADDED,
  BADGE_TYPE_DELETED,
  RECEIVE_ACCESS_LEVELS,
  RECEIVE_BADGE_FEATURES,
  RECEIVE_VIEW_TYPES
} from "../../actions/badge-actions";

import { RECEIVE_USER_ROLES_BY_SUMMIT } from "../../actions/user-chat-roles-actions";

import {
  RECEIVE_REFUND_POLICIES,
  TICKET_TYPES_CURRENCY_UPDATED
} from "../../actions/ticket-actions";
import {
  RECEIVE_ORDER_EXTRA_QUESTIONS,
  RECEIVE_MAIN_ORDER_EXTRA_QUESTIONS,
  ORDER_EXTRA_QUESTION_ADDED
} from "../../actions/order-actions";
import {
  RECEIVE_PRINT_APP_SETTINGS,
  RECEIVE_REG_LITE_SETTINGS
} from "../../actions/marketing-actions";
import { REG_LITE_BOOLEAN_SETTINGS } from "../../utils/constants";
import {
  denormalizeLeadReportSettings,
  renderOptions,
  updateSummitLeadReportSettings
} from "../../models/lead-report-settings";

export const DEFAULT_ENTITY = {
  id: 0,
  name: "",
  active: false,
  allow_update_attendee_extra_questions: false,
  attendees_count: 0,
  available_on_api: false,
  calendar_sync_desc: "",
  calendar_sync_name: "",
  dates_label: "",
  end_date: 0,
  event_types: [],
  link: "",
  locations: [],
  logo: null,
  secondary_logo: null,
  page_url: "",
  presentation_voters_count: 0,
  presentation_votes_count: 0,
  presentations_submitted_count: 0,
  published_events_count: 0,
  reassign_ticket_till_date: 0,
  registration_begin_date: 0,
  registration_end_date: 0,
  registration_link: "",
  registration_disclaimer_content: "",
  registration_disclaimer_mandatory: false,
  registration_slug_prefix: "",
  schedule_event_detail_url: "",
  schedule_page_url: "",
  schedule_start_date: 0,
  secondary_registration_label: "",
  secondary_registration_link: "",
  speaker_announcement_email_accepted_alternate_count: 0,
  speaker_announcement_email_accepted_count: 0,
  speaker_announcement_email_accepted_rejected_count: 0,
  speaker_announcement_email_alternate_count: 0,
  speaker_announcement_email_alternate_rejected_count: 0,
  speaker_announcement_email_rejected_count: 0,
  speakers_count: 0,
  start_date: 0,
  start_showing_venues_date: 0,
  slug: "",
  supported_currencies: ["USD", "EUR"],
  default_ticket_type_currency: "USD",
  ticket_types: [],
  time_zone: {},
  time_zone_id: "",
  time_zone_label: "",
  timestamp: 0,
  tracks: [],
  type_id: 0,
  wifi_connections: [],
  selection_plans: [],
  meeting_booking_room_allowed_attributes: [],
  meeting_room_booking_end_time: null,
  meeting_room_booking_max_allowed: 0,
  meeting_room_booking_slot_length: 0,
  meeting_room_booking_start_time: null,
  api_feed_type: "",
  api_feed_url: "",
  api_feed_key: "",
  refund_policies: [],
  badge_access_level_types: null,
  badge_types: null,
  badge_features: null,
  badge_view_types: null,
  order_extra_questions: null,
  order_only_extra_questions: null,
  attendee_extra_questions: null,
  attendee_main_extra_questions: null,
  begin_allow_booking_date: 0,
  end_allow_booking_date: 0,
  external_summit_id: null,
  external_registration_feed_type: "",
  external_registration_feed_api_key: null,
  virtual_site_url: null,
  marketing_site_url: null,
  mux_token_id: null,
  mux_token_secret: null,
  mux_allowed_domains: [],
  help_users: [],
  registration_send_qr_as_image_attachment_on_ticket_email: false,
  registration_send_ticket_as_pdf_attachment_on_ticket_email: false,
  registration_allow_automatic_reminder_emails: true,
  registration_send_order_email_automatically: true,
  qr_codes_enc_key: "N/A",
  speaker_confirmation_default_page_url: "",
  marketing_site_oauth2_client_id: null,
  marketing_site_oauth2_client_scopes: null,
  available_lead_report_columns: []
};

const DEFAULT_REG_LITE_MARKETING_SETTINGS = {
  REG_LITE_ALLOW_PROMO_CODES: { id: 0, value: true },
  REG_LITE_SHOW_COMPANY_INPUT: { id: 0, value: true },
  REG_LITE_COMPANY_DDL_PLACEHOLDER: { id: 0, value: "Select a company" },
  REG_LITE_SHOW_COMPANY_INPUT_DEFAULT_OPTIONS: { id: 0, value: false },
  REG_LITE_ORDER_COMPLETE_TITLE: {
    id: 0,
    value: "Payment Processed"
  },
  REG_LITE_INITIAL_ORDER_COMPLETE_STEP_1ST_PARAGRAPH: {
    id: 0,
    value:
      "Ticket(s) have been assigned to you. To activate your ticket(s) you must answer your attendee questions. Click the \"{button}\" button below."
  },
  REG_LITE_INITIAL_ORDER_COMPLETE_STEP_2ND_PARAGRAPH: {
    id: 0,
    value:
      "If you wish to transfer your assigned ticket, close this window and visit the \"My Orders/Tickets\" tab in the top navigation bar. "
  },
  REG_LITE_INITIAL_ORDER_COMPLETE_BTN_LABEL: { id: 0, value: "Activate Now" },
  REG_LITE_ORDER_COMPLETE_STEP_1ST_PARAGRAPH: {
    id: 0,
    value:
      "You may visit the My Orders/Tickets tab in the top right-hand corner of the navigation bar to\n" +
      " assign/reassign tickets or to complete any required ticket details."
  },
  REG_LITE_ORDER_COMPLETE_STEP_2ND_PARAGRAPH: { id: 0, value: "" },
  REG_LITE_ORDER_COMPLETE_BTN_LABEL: { id: 0, value: "" },
  REG_LITE_NO_ALLOWED_TICKETS_MESSAGE: {
    id: 0,
    value:
      "<span>You already have purchased all available tickets for this event and/or there are no tickets available for you to purchase.</span><br/><span><a href=\"/a/my-tickets\">Visit the my orders / my tickets page</a> to review your existing tickets.</span>"
  }
};

const DEFAULT_PRINT_APP_MARKETING_SETTINGS = {
  PRINT_APP_HIDE_FIND_TICKET_BY_EMAIL: { id: 0, value: false },
  PRINT_APP_HIDE_FIND_TICKET_BY_FULLNAME: { id: 0, value: false }
};

const DEFAULT_STATE = {
  currentSummit: DEFAULT_ENTITY,
  errors: {},
  loading: true,
  reg_lite_marketing_settings: DEFAULT_REG_LITE_MARKETING_SETTINGS,
  print_app_marketing_settings: DEFAULT_PRINT_APP_MARKETING_SETTINGS
};

const currentSummitReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT: {
      return state;
    }
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case RESET_SUMMIT_FORM: {
      return DEFAULT_STATE;
    }
    case REQUEST_SUMMIT: {
      const { id } = payload;
      let { currentSummit } = state;
      if (id !== currentSummit.id) {
        currentSummit = { ...DEFAULT_ENTITY, id: payload.id, loading: true };
      }
      return { ...DEFAULT_STATE, loading: true, currentSummit };
    }
    case CLEAR_SUMMIT: {
      return DEFAULT_STATE;
    }
    case SUMMIT_ADDED:
    case SUMMIT_UPDATED:
    case RECEIVE_SUMMIT: {
      const entity = { ...payload.response };

      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      if (!entity.external_registration_feed_type)
        entity.external_registration_feed_type = "none";

      if (!entity.api_feed_type) entity.api_feed_type = "none";
      if (entity.hasOwnProperty("mux_allowed_domains")) {
        entity.mux_allowed_domains = entity.mux_allowed_domains.map((e) => ({
          label: e,
          value: e
        }));
      }

      return {
        ...state,
        currentSummit: { ...state.currentSummit, ...entity },
        errors: {},
        loading: false
      };
    }
    case UPDATE_SUMMIT: {
      return { ...state, currentSummit: { ...payload }, errors: {} };
    }
    case SUMMIT_LOGO_ATTACHED: {
      return {
        ...state,
        currentSummit: { ...state.currentSummit, ...payload }
      };
    }
    case SUMMIT_LOGO_DELETED: {
      return {
        ...state,
        currentSummit: { ...state.currentSummit, ...payload }
      };
    }
    case REGISTRATION_KEY_GENERATED: {
      const { qr_codes_enc_key } = payload.response;
      return {
        ...state,
        currentSummit: { ...state.currentSummit, qr_codes_enc_key }
      };
    }
    case EVENT_TYPE_UPDATED: {
      const { response } = payload;
      const eventTypes = state.currentSummit.event_types.filter(
        (e) => e.id !== response.id
      );
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          event_types: [...eventTypes, response]
        }
      };
    }
    case EVENT_TYPE_ADDED: {
      const { response } = payload;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          event_types: [...state.currentSummit.event_types, response]
        }
      };
    }
    case EVENT_TYPE_DELETED: {
      const { eventTypeId } = payload;
      const eventTypes = state.currentSummit.event_types.filter(
        (e) => e.id !== eventTypeId
      );
      return {
        ...state,
        currentSummit: { ...state.currentSummit, event_types: eventTypes }
      };
    }
    case EVENT_TYPES_SEEDED: {
      const eventTypesAdded = payload.response.data;

      if (eventTypesAdded.length > 0) {
        return {
          ...state,
          currentSummit: {
            ...state.currentSummit,
            event_types: [
              ...state.currentSummit.event_types,
              ...eventTypesAdded
            ]
          }
        };
      }
      return state;
    }
    case EVENT_CATEGORY_UPDATED: {
      const { response } = payload;
      const tracks = state.currentSummit.tracks.filter(
        (t) => t.id !== response.id
      );
      return {
        ...state,
        currentSummit: { ...state.currentSummit, tracks: [...tracks, response] }
      };
    }
    case EVENT_CATEGORY_ADDED: {
      const { response } = payload;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          tracks: [...state.currentSummit.tracks, response]
        }
      };
    }
    case EVENT_CATEGORIES_SEEDED: {
      const eventCategoriesAdded = payload.response.data;

      if (eventCategoriesAdded.length > 0) {
        return {
          ...state,
          currentSummit: {
            ...state.currentSummit,
            tracks: [...state.currentSummit.tracks, ...eventCategoriesAdded]
          }
        };
      }
      return state;
    }
    case EVENT_CATEGORY_DELETED: {
      const { trackId } = payload;
      const tracks = state.currentSummit.tracks.filter((t) => t.id !== trackId);
      return {
        ...state,
        currentSummit: { ...state.currentSummit, tracks }
      };
    }
    case UNLINK_SUBTRACK: {
      const { subTrackId } = payload;
      const tracks = state.currentSummit.tracks.map((t) =>
        t.id === subTrackId ? { ...t, parent_id: 0 } : t
      );
      return { ...state, currentSummit: { ...state.currentSummit, tracks } };
    }
    case LOCATION_UPDATED: {
      const { response } = payload;
      const locations = state.currentSummit.locations.filter(
        (l) => l.id !== response.id
      );
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          locations: [...locations, response]
        }
      };
    }
    case ROOM_ADDED:
    case LOCATION_ADDED: {
      const { response } = payload;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          locations: [...state.currentSummit.locations, response]
        }
      };
    }
    case LOCATION_DELETED: {
      const { locationId } = payload;
      const locations = state.currentSummit.locations.filter(
        (l) => l.id !== locationId
      );
      return {
        ...state,
        currentSummit: { ...state.currentSummit, locations }
      };
    }
    case ROOM_DELETED: {
      const { roomId } = payload;
      const locations = state.currentSummit.locations.filter(
        (l) => l.id !== roomId
      );
      return {
        ...state,
        currentSummit: { ...state.currentSummit, locations }
      };
    }
    case SELECTION_PLAN_ADDED: {
      const { response } = payload;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          selection_plans: [...state.currentSummit.selection_plans, response]
        }
      };
    }
    case SELECTION_PLAN_UPDATED: {
      const { response } = payload;
      const selection_plans = state.currentSummit.selection_plans.filter(
        (sp) => sp.id !== response.id
      );
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          selection_plans: [...selection_plans, response].sort(
            (a, b) => a.id - b.id
          )
        }
      };
    }
    case SELECTION_PLAN_DELETED: {
      const { selectionPlanId } = payload;
      const selection_plans = state.currentSummit.selection_plans.filter(
        (sp) => sp.id !== selectionPlanId
      );
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          selection_plans
        }
      };
    }
    case ROOM_BOOKING_ATTRIBUTE_TYPE_UPDATED:
    case ROOM_BOOKING_ATTRIBUTE_TYPE_ADDED: {
      const { response } = payload;
      const attributeType =
        state.currentSummit.meeting_booking_room_allowed_attributes.find(
          (b) => b.id === response.id
        );
      if (attributeType) {
        response.values = attributeType.values;
      }
      const attributeTypes =
        state.currentSummit.meeting_booking_room_allowed_attributes.filter(
          (b) => b.id !== response.id
        );
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          meeting_booking_room_allowed_attributes: [...attributeTypes, response]
        }
      };
    }
    case ROOM_BOOKING_ATTRIBUTE_TYPE_DELETED: {
      const { attributeTypeId } = payload;
      const attributeTypes =
        state.currentSummit.meeting_booking_room_allowed_attributes.filter(
          (a) => a.id !== attributeTypeId
        );
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          meeting_booking_room_allowed_attributes: attributeTypes
        }
      };
    }
    case ROOM_BOOKING_ATTRIBUTE_UPDATED:
    case ROOM_BOOKING_ATTRIBUTE_ADDED: {
      const { response } = payload;
      const attributeTypes =
        state.currentSummit.meeting_booking_room_allowed_attributes.filter(
          (b) => b.id !== response.type_id
        );
      let attributeType =
        state.currentSummit.meeting_booking_room_allowed_attributes.find(
          (b) => b.id === response.type_id
        );
      let values = attributeType.values.filter((v) => v.id !== response.id);
      values = [...values, response];
      attributeType = { ...attributeType, values };
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          meeting_booking_room_allowed_attributes: [
            ...attributeTypes,
            attributeType
          ]
        }
      };
    }
    case ROOM_BOOKING_ATTRIBUTE_DELETED: {
      const { attributeTypeId, attributeValueId } = payload;
      const attributeTypes =
        state.currentSummit.meeting_booking_room_allowed_attributes.filter(
          (a) => a.id !== attributeTypeId
        );
      let attributeType =
        state.currentSummit.meeting_booking_room_allowed_attributes.find(
          (a) => a.id === attributeTypeId
        );
      const values = attributeType.values.filter(
        (v) => v.id !== attributeValueId
      );
      attributeType = { ...attributeType, values };
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          meeting_booking_room_allowed_attributes: [
            ...attributeTypes,
            attributeType
          ]
        }
      };
    }
    case RECEIVE_BADGE_TYPES: {
      const badgeTypes = payload.response.data;

      return {
        ...state,
        currentSummit: { ...state.currentSummit, badge_types: badgeTypes }
      };
    }
    case BADGE_TYPE_ADDED: {
      const newBadgeType = payload.response;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          badge_types: [...state.currentSummit.badge_types, newBadgeType]
        }
      };
    }
    case BADGE_TYPE_DELETED: {
      const { badgeTypeId } = payload;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          badge_types: [
            ...state.currentSummit.badge_types.filter(
              (bt) => bt.id !== badgeTypeId
            )
          ]
        }
      };
    }
    case RECEIVE_REFUND_POLICIES: {
      const refundPolicies = payload.response.data;

      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          refund_policies: refundPolicies
        }
      };
    }
    case RECEIVE_ACCESS_LEVELS: {
      const accessLevels = payload.response.data;

      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          badge_access_level_types: accessLevels
        }
      };
    }
    case RECEIVE_BADGE_FEATURES: {
      const badgeFeatures = payload.response.data;

      return {
        ...state,
        currentSummit: { ...state.currentSummit, badge_features: badgeFeatures }
      };
    }
    case RECEIVE_VIEW_TYPES: {
      const viewTypes = payload.response.data;

      return {
        ...state,
        currentSummit: { ...state.currentSummit, badge_view_types: viewTypes }
      };
    }
    case RECEIVE_ORDER_EXTRA_QUESTIONS: {
      const allExtraQuestions = payload.response.data;

      const order_only_extra_questions = allExtraQuestions.filter(
        (eq) => eq.usage === "Both" || eq.usage === "Order"
      );
      const attendee_extra_questions = allExtraQuestions.filter(
        (eq) => eq.usage === "Both" || eq.usage === "Ticket"
      );

      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          order_only_extra_questions,
          attendee_extra_questions
        }
      };
    }
    case VALIDATE: {
      return { ...state, errors: payload.errors };
    }
    case RECEIVE_USER_ROLES_BY_SUMMIT: {
      const helpUsers = payload.response;
      return {
        ...state,
        currentSummit: { ...state.currentSummit, help_users: helpUsers }
      };
    }
    case RECEIVE_MAIN_ORDER_EXTRA_QUESTIONS: {
      const mainExtraQuestions = payload.response.data;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          attendee_main_extra_questions: mainExtraQuestions
        }
      };
    }
    case ORDER_EXTRA_QUESTION_ADDED: {
      const extraQuestion = payload.response;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          order_extra_questions: [
            ...state.currentSummit.order_extra_questions,
            extraQuestion
          ]
        }
      };
    }
    case RECEIVE_REG_LITE_SETTINGS: {
      const { data } = payload.response;
      const reg_lite_marketing_settings = {};

      data.forEach((setting) => {
        let { value } = setting;
        if (REG_LITE_BOOLEAN_SETTINGS.includes(setting.key)) {
          value = value === "1";
        }
        reg_lite_marketing_settings[setting.key] = {
          id: setting.id,
          value
        };
      });

      const newMarketingSettings = {
        ...DEFAULT_STATE.reg_lite_marketing_settings,
        ...reg_lite_marketing_settings
      };

      return { ...state, reg_lite_marketing_settings: newMarketingSettings };
    }
    case RECEIVE_PRINT_APP_SETTINGS: {
      const { data } = payload.response;
      const print_app_marketing_settings = {};

      data.forEach((setting) => {
        let { value } = setting;
        if (
          setting.key === "PRINT_APP_HIDE_FIND_TICKET_BY_EMAIL" ||
          setting.key === "PRINT_APP_HIDE_FIND_TICKET_BY_FULLNAME"
        ) {
          value = value === "1";
        }
        print_app_marketing_settings[setting.key] = {
          id: setting.id,
          value
        };
      });

      const newMarketingSettings = {
        ...DEFAULT_STATE.print_app_marketing_settings,
        ...print_app_marketing_settings
      };

      return { ...state, print_app_marketing_settings: newMarketingSettings };
    }
    case RECEIVE_LEAD_REPORT_SETTINGS_META: {
      const availableColumns = renderOptions(
        denormalizeLeadReportSettings(payload.response)
      );
      return { ...state, available_lead_report_columns: availableColumns };
    }
    case LEAD_REPORT_SETTINGS_UPDATED: {
      const updatedSettings = updateSummitLeadReportSettings(
        state.currentSummit,
        payload.response
      );
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          lead_report_settings: updatedSettings
        }
      };
    }
    case TICKET_TYPES_CURRENCY_UPDATED: {
      const { currency } = payload;
      return {
        ...state,
        currentSummit: {
          ...state.currentSummit,
          default_ticket_type_currency: currency
        }
      };
    }
    default:
      return state;
  }
};

export default currentSummitReducer;
