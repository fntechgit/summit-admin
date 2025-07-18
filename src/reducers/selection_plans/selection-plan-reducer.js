import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  RECEIVE_SELECTION_PLAN,
  RESET_SELECTION_PLAN_FORM,
  UPDATE_SELECTION_PLAN,
  SELECTION_PLAN_UPDATED,
  SELECTION_PLAN_ADDED,
  TRACK_GROUP_REMOVED,
  TRACK_GROUP_ADDED,
  EVENT_TYPE_ADDED,
  EVENT_TYPE_REMOVED,
  SELECTION_PLAN_EXTRA_QUESTION_ADDED,
  SELECTION_PLAN_EXTRA_QUESTION_DELETED,
  SELECTION_PLAN_EXTRA_QUESTION_UPDATED,
  SELECTION_PLAN_EXTRA_QUESTION_ORDER_UPDATED,
  SELECTION_PLAN_RATING_TYPE_ADDED,
  SELECTION_PLAN_RATING_TYPE_REMOVED,
  SELECTION_PLAN_RATING_TYPE_UPDATED,
  SELECTION_PLAN_RATING_TYPE_ORDER_UPDATED,
  SELECTION_PLAN_ASSIGNED_EXTRA_QUESTION,
  RECEIVE_SELECTION_PLAN_PROGRESS_FLAGS,
  SELECTION_PLAN_ASSIGNED_PROGRESS_FLAG,
  SELECTION_PLAN_PROGRESS_FLAG_ORDER_UPDATED,
  SELECTION_PLAN_PROGRESS_FLAG_REMOVED,
  RECEIVE_ALLOWED_MEMBERS,
  ALLOWED_MEMBER_REMOVED,
  ALLOWED_MEMBER_ADDED,
  ALLOWED_MEMBERS_IMPORTED
} from "../../actions/selection-plan-actions";
import { RECEIVE_SELECTION_PLAN_SETTINGS } from "../../actions/marketing-actions";

export const DEFAULT_ALLOWED_QUESTIONS = [
  { label: "Level of difficulty", value: "level" },
  { label: "Abstract", value: "description" },
  { label: "Social Summary", value: "social_description" },
  { label: "What is expected to learn?", value: "attendees_expected_learnt" },
  { label: "Discuss with attending media?", value: "attending_media" },
  { label: "Links", value: "links" }
];

export const DEFAULT_ALLOWED_EDITABLE_QUESTIONS = [
  { label: "Disclaimer Accepted", value: "disclaimer_accepted" },
  { label: "Title", value: "title" },
  { label: "Category", value: "track_id" },
  { label: "Level of difficulty", value: "level" },
  { label: "Abstract", value: "description" },
  { label: "Social Summary", value: "social_description" },
  { label: "What is expected to learn?", value: "attendees_expected_learnt" },
  { label: "Discuss with attending media?", value: "attending_media" },
  { label: "Links", value: "links" }
];

export const DEFAULT_CFP_PRESENTATION_EDITION_TABS = [
  { label: "Summary", value: "summary" },
  { label: "Uploads", value: "uploads" },
  { label: "Tags", value: "tags" },
  { label: "Speakers", value: "speakers" },
  { label: "Review", value: "review" }
];

export const DEFAULT_ENTITY = {
  id: 0,
  name: "",
  submission_period_disclaimer: "",
  is_enabled: false,
  max_submission_allowed_per_user: 0,
  selection_begin_date: 0,
  selection_end_date: 0,
  submission_begin_date: 0,
  submission_end_date: 0,
  submission_lock_down_presentation_status_date: 0,
  voting_begin_date: 0,
  voting_end_date: 0,
  track_groups: [],
  event_types: [],
  extra_questions: [],
  extraQuestionsOrder: "order",
  extraQuestionsOrderDir: 1,
  allow_new_presentations: false,
  allow_proposed_schedules: false,
  presentation_creator_notification_email_template: "",
  presentation_moderator_notification_email_template: "",
  presentation_speaker_notification_email_template: "",
  track_chair_rating_types: [],
  allow_track_change_requests: true,
  allowed_presentation_action_types: [],
  allowed_presentation_questions: DEFAULT_ALLOWED_QUESTIONS.map((q) => q.value),
  allowed_presentation_editable_questions:
    DEFAULT_ALLOWED_EDITABLE_QUESTIONS.map((q) => q.value),
  marketing_settings: {
    cfp_landing_page_title: { id: 0, value: "" },
    cfp_track_question_label: { id: 0, value: "" },
    cfp_speakers_singular_label: { id: 0, value: "" },
    cfp_speakers_plural_label: { id: 0, value: "" },
    cfp_presentation_summary_title_label: { id: 0, value: "" },
    cfp_presentation_summary_abstract_label: { id: 0, value: "" },
    cfp_presentation_summary_social_summary_label: { id: 0, value: "" },
    cfp_presentations_singular_label: { id: 0, value: "" },
    cfp_presentations_plural_label: { id: 0, value: "" },
    cfp_presentation_summary_links_label: { id: 0, value: "" },
    cfp_presentation_edition_custom_message: { id: 0, value: "" },
    cfp_presentation_edition_default_tab: { id: 0, value: "" },
    cfp_presentation_summary_hide_track_selection: { id: 0, value: false },
    cfp_presentation_summary_hide_activity_type_selection: {
      id: 0,
      value: false
    }
  }
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  allowedMembers: { data: [], currentPage: 1, lastPage: 1 },
  errors: {}
};

const selectionPlanReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      } 
        return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
      
    }
    case SET_CURRENT_SUMMIT:
    case RESET_SELECTION_PLAN_FORM: {
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    }
    case UPDATE_SELECTION_PLAN: {
      return { ...state, entity: { ...payload }, errors: {} };
    }
    case SELECTION_PLAN_ADDED:
    case RECEIVE_SELECTION_PLAN: {
      const entity = { ...payload.response };
      const marketing_setting = state.entity.marketing_settings;

      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      return {
        ...state,
        entity: { ...DEFAULT_ENTITY, ...entity, marketing_setting }
      };
    }
    case SELECTION_PLAN_UPDATED: {
      return state;
    }
    case RECEIVE_ALLOWED_MEMBERS: {
      const { data, current_page, last_page } = payload.response;
      return {
        ...state,
        allowedMembers: {
          data,
          currentPage: current_page,
          lastPage: last_page
        }
      };
    }
    case SELECTION_PLAN_ASSIGNED_EXTRA_QUESTION: {
      const question = { ...payload.response };
      return {
        ...state,
        entity: {
          ...state.entity,
          extra_questions: [...state.entity.extra_questions, question]
        }
      };
    }
    case RECEIVE_SELECTION_PLAN_PROGRESS_FLAGS: {
      const progressFlags = payload.response.data.map((r) => ({
          id: r.id,
          label: r.label,
          order: parseInt(r.order)
        }));
      return {
        ...state,
        entity: {
          ...state.entity,
          allowed_presentation_action_types: progressFlags
        }
      };
    }
    case SELECTION_PLAN_ASSIGNED_PROGRESS_FLAG: {
      const progressFlag = { ...payload.response };
      return {
        ...state,
        entity: {
          ...state.entity,
          allowed_presentation_action_types: [
            ...state.entity.allowed_presentation_action_types,
            progressFlag
          ]
        }
      };
    }
    case SELECTION_PLAN_PROGRESS_FLAG_ORDER_UPDATED: {
      const progressFlags = payload.map((r) => ({
          id: r.id,
          label: r.label,
          order: parseInt(r.order)
        }));
      return {
        ...state,
        entity: {
          ...state.entity,
          allowed_presentation_action_types: progressFlags
        }
      };
    }
    case SELECTION_PLAN_PROGRESS_FLAG_REMOVED: {
      const { progressFlagId } = payload;
      const allowedActionTypes =
        state.entity.allowed_presentation_action_types.filter(
          (t) => t.id !== progressFlagId
        );
      return {
        ...state,
        entity: {
          ...state.entity,
          allowed_presentation_action_types: allowedActionTypes
        }
      };
    }
    case TRACK_GROUP_REMOVED: {
      const { trackGroupId } = payload;
      const trackGroups = state.entity.track_groups.filter(
        (t) => t.id !== trackGroupId
      );
      return {
        ...state,
        entity: { ...state.entity, track_groups: trackGroups }
      };
    }
    case TRACK_GROUP_ADDED: {
      const trackGroup = { ...payload.trackGroup };
      return {
        ...state,
        entity: {
          ...state.entity,
          track_groups: [...state.entity.track_groups, trackGroup]
        }
      };
    }
    case EVENT_TYPE_REMOVED: {
      const { eventTypeId } = payload;
      const eventTypes = state.entity.event_types.filter(
        (t) => t.id !== eventTypeId
      );
      return { ...state, entity: { ...state.entity, event_types: eventTypes } };
    }
    case EVENT_TYPE_ADDED: {
      const eventType = { ...payload.eventType };
      return {
        ...state,
        entity: {
          ...state.entity,
          event_types: [...state.entity.event_types, eventType]
        }
      };
    }
    case SELECTION_PLAN_EXTRA_QUESTION_ADDED: {
      const question = { ...payload.response };
      return {
        ...state,
        entity: {
          ...state.entity,
          extra_questions: [...state.entity.extra_questions, question]
        }
      };
    }
    case SELECTION_PLAN_EXTRA_QUESTION_DELETED: {
      const { questionId } = payload;
      return {
        ...state,
        entity: {
          ...state.entity,
          extra_questions: state.entity.extra_questions.filter(
            (t) => t.id !== questionId
          )
        }
      };
    }
    case SELECTION_PLAN_EXTRA_QUESTION_UPDATED: {
      const question = { ...payload.response };
      const extra_questions = state.entity.extra_questions.map((q) => {
        if (q.id !== question.id) {
          return q;
        }
        return {
          ...q,
          ...question
        };
      });
      return {
        ...state,
        entity: { ...state.entity, extra_questions }
      };
    }

    case SELECTION_PLAN_EXTRA_QUESTION_ORDER_UPDATED: {
      const extra_questions = payload.map((q, i) => ({
          id: q.id,
          name: q.name,
          label: q.label,
          type: q.type,
          order: i + 1
        }));

      return {
        ...state,
        entity: { ...state.entity, extra_questions }
      };
    }
    case SELECTION_PLAN_RATING_TYPE_REMOVED: {
      const { ratingTypeId } = payload;
      const ratingTypes = state.entity.track_chair_rating_types.filter(
        (t) => t.id !== ratingTypeId
      );
      return {
        ...state,
        entity: { ...state.entity, track_chair_rating_types: ratingTypes }
      };
    }
    case SELECTION_PLAN_RATING_TYPE_ADDED: {
      const ratingType = { ...payload.response };
      return {
        ...state,
        entity: {
          ...state.entity,
          track_chair_rating_types: [
            ...state.entity.track_chair_rating_types,
            ratingType
          ]
        }
      };
    }
    case SELECTION_PLAN_RATING_TYPE_UPDATED: {
      const ratingType = { ...payload.response };
      const ratingTypes = state.entity.track_chair_rating_types.filter(
        (t) => t.id !== ratingType.id
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          track_chair_rating_types: [...ratingTypes, ratingType]
        }
      };
    }
    case SELECTION_PLAN_RATING_TYPE_ORDER_UPDATED: {
      const track_chair_rating_types = payload.map((r) => ({
          id: r.id,
          name: r.name,
          weight: parseFloat(r.weight),
          order: parseInt(r.order)
        }));
      return {
        ...state,
        entity: {
          ...state.entity,
          track_chair_rating_types
        }
      };
    }
    case ALLOWED_MEMBER_REMOVED: {
      const { emailId } = payload;
      const allowedMembers = state.allowedMembers.data.filter(
        (t) => t.id !== emailId
      );
      return {
        ...state,
        allowedMembers: { ...state.allowedMembers, data: allowedMembers }
      };
    }
    case ALLOWED_MEMBER_ADDED: {
      return {
        ...state,
        allowedMembers: {
          ...state.allowedMembers,
          data: [...state.allowedMembers.data, payload.response]
        }
      };
    }
    case ALLOWED_MEMBERS_IMPORTED: {
      return state;
    }
    case VALIDATE: {
      return { ...state, errors: payload.errors };
    }
    case RECEIVE_SELECTION_PLAN_SETTINGS: {
      const {data} = payload.response;
      // parse data
      const settings = data.map((ms) => ({
        [ms.key.toLowerCase()]: {
          id: ms.id || null,
          // if is one of the settings that uses boolean values, parse the 1/0 values to true/false
          value:
            ms.key === "CFP_PRESENTATION_SUMMARY_HIDE_TRACK_SELECTION" ||
            ms.key === "CFP_PRESENTATION_SUMMARY_HIDE_ACTIVITY_TYPE_SELECTION"
              ? ms.value === "1"
              : ms.value
        }
      }));
      // array to object
      const marketing_settings = Object.assign(...settings, {});
      return {
        ...state,
        entity: {
          ...state.entity,
          marketing_settings: {
            ...state.entity.marketing_settings,
            ...marketing_settings
          }
        }
      };
    }
    default:
      return state;
  }
};

export default selectionPlanReducer;
