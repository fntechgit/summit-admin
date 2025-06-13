/**
 * Copyright 2017 OpenStack Foundation
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

import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import moment from "moment-timezone";
import {
  EVENT_ADDED,
  EVENT_FEEDBACK_DELETED,
  EVENT_PUBLISHED,
  EVENT_UPDATED,
  FLAG_CHANGED,
  IMAGE_ATTACHED,
  IMAGE_DELETED,
  RECEIVE_ACTION_TYPES,
  RECEIVE_EVENT,
  RECEIVE_EVENT_COMMENTS,
  RECEIVE_EVENT_FEEDBACK,
  REQUEST_EVENT_COMMENTS,
  REQUEST_EVENT_FEEDBACK,
  RESET_EVENT_FORM
} from "../../actions/event-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { UNPUBLISHED_EVENT } from "../../actions/summit-builder-actions";
import {
  EVENT_MATERIAL_ADDED,
  EVENT_MATERIAL_DELETED,
  EVENT_MATERIAL_UPDATED
} from "../../actions/event-material-actions";
import { EVENT_COMMENT_DELETED } from "../../actions/event-comment-actions";
import { RECEIVE_QA_USERS_BY_SUMMIT_EVENT } from "../../actions/user-chat-roles-actions";
import { MILLISECONDS_IN_SECOND } from "../../utils/constants";

export const DEFAULT_ENTITY = {
  id: 0,
  type_id: null,
  title: "",
  creator: null,
  description: "",
  social_description: "",
  attendees_expected_learnt: "",
  head_count: 0,
  rsvp_link: "",
  location_id: 0,
  start_date: "",
  end_date: "",
  duration: 0,
  level: "N/A",
  allow_feedback: false,
  to_record: false,
  attending_media: false,
  tags: [],
  sponsors: [],
  speakers: [],
  moderator: null,
  discussion_leader: 0,
  groups: [],
  attachment: "",
  occupancy: "EMPTY",
  materials: [],
  image: null,
  qa_users: [],
  extra_questions: [],
  disclaimer_accepted: false,
  disclaimer_accepted_date: null,
  created_by: null,
  custom_order: 0,
  actions: [],
  allowed_ticket_types: [],
  submission_source: "Admin"
};

const DEFAULT_STATE_FEEDBACK_STATE = {
  items: [],
  term: null,
  order: "created",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  total: 0,
  summitTZ: ""
};

const DEFAULT_STATE_COMMENT_STATE = {
  comments: [],
  term: null,
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalComments: 0,
  filters: { is_activity: null, is_public: null }
};

const DEFAULT_STATE = {
  levelOptions: ["N/A", "Beginner", "Intermediate", "Advanced"],
  entity: DEFAULT_ENTITY,
  errors: {},
  feedbackState: DEFAULT_STATE_FEEDBACK_STATE,
  commentState: DEFAULT_STATE_COMMENT_STATE,
  actionTypes: []
};

const normalizeEventResponse = (entity) => {
  const links = entity.slides || [];
  const videos = entity.videos || [];
  const slides = entity.links || [];
  let media_uploads = entity.media_uploads || [];

  for (const key in entity) {
    if (entity.hasOwnProperty(key)) {
      entity[key] = entity[key] == null ? "" : entity[key];
    }
  }

  if (!entity.rsvp_external) entity.rsvp_link = null;
  media_uploads = media_uploads.map((m) => ({
    ...m,
    media_upload_type_id: m.media_upload_type?.id || 0
  }));
  entity.materials = [...media_uploads, ...links, ...videos, ...slides];
  entity.type_id = entity.type ? entity.type.id : null;

  entity.materials = [
    ...entity.materials.map((m) => ({
      ...m,
      display_on_site_label: m.display_on_site ? "Yes" : "No"
    }))
  ];
  entity.selection_plan_id = entity.selection_plan?.id || null;
  return entity;
};

const summitEventReducer = (state = DEFAULT_STATE, action) => {
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
    case RESET_EVENT_FORM: {
      return DEFAULT_STATE;
    }
    case EVENT_ADDED:
    case RECEIVE_EVENT: {
      const entity = normalizeEventResponse(payload.response);

      return {
        ...state,
        entity: { ...DEFAULT_ENTITY, ...entity },
        errors: {}
      };
    }
    case EVENT_PUBLISHED: {
      return {
        ...state,
        entity: { ...state.entity, is_published: true },
        errors: {}
      };
    }
    case UNPUBLISHED_EVENT: {
      return {
        ...state,
        entity: { ...state.entity, is_published: false },
        errors: {}
      };
    }
    case EVENT_UPDATED: {
      const entity = normalizeEventResponse(payload.response);
      return { ...state, entity, errors: {} };
    }
    case EVENT_MATERIAL_DELETED: {
      const {eventMaterialId} = payload;
      const materials = state.entity.materials.filter(
        (m) => m.id !== eventMaterialId
      );

      return {
        ...state,
        entity: { ...state.entity, materials },
        errors: {}
      };
    }
    case EVENT_MATERIAL_ADDED: {
      const newMaterial = { ...payload.response };

      newMaterial.display_on_site_label = newMaterial.display_on_site
        ? "Yes"
        : "No";

      const materials = [...state.entity.materials, newMaterial];

      return {
        ...state,
        entity: { ...state.entity, materials },
        errors: {}
      };
    }
    case EVENT_MATERIAL_UPDATED: {
      const newMaterial = { ...payload.response };
      const oldMaterials = state.entity.materials.filter(
        (m) => m.id !== newMaterial.id
      );

      newMaterial.display_on_site_label = newMaterial.display_on_site
        ? "Yes"
        : "No";

      const materials = [...oldMaterials, newMaterial];

      return {
        ...state,
        entity: { ...state.entity, materials },
        errors: {}
      };
    }
    case IMAGE_ATTACHED: {
      const image = { ...payload.response };
      return { ...state, entity: { ...state.entity, image: image.url } };
    }
    case IMAGE_DELETED: {
      return { ...state, entity: { ...state.entity, image: null } };
    }
    case VALIDATE: {
      return { ...state, errors: payload.errors };
    }
    case RECEIVE_QA_USERS_BY_SUMMIT_EVENT: {
      const qaUsers = payload.response;
      return { ...state, entity: { ...state.entity, qa_users: qaUsers } };
    }
    case REQUEST_EVENT_FEEDBACK: {
      const { order, orderDir, term, summitTZ } = payload;
      return {
        ...state,
        feedbackState: {
          ...state.feedbackState,
          order,
          orderDir,
          term,
          summitTZ
        }
      };
    }
    case RECEIVE_EVENT_FEEDBACK: {
      const { current_page, total, last_page } = payload.response;

      const items = payload.response.data.map((e) => ({
        ...e,
        owner_full_name: `${e.owner.first_name} ${e.owner.last_name}`,
        created: moment(e.created_date * MILLISECONDS_IN_SECOND)
          .tz(state.feedbackState.summitTZ)
          .format("MMMM Do YYYY, h:mm a")
      }));

      return {
        ...state,
        feedbackState: {
          ...state.feedbackState,
          items,
          currentPage: current_page,
          totalEvents: total,
          lastPage: last_page
        }
      };
    }
    case EVENT_FEEDBACK_DELETED: {
      const { feedbackId } = payload;
      return {
        ...state,
        feedbackState: {
          ...state.feedbackState,
          items: state.feedbackState.items.filter((e) => e.id !== feedbackId)
        }
      };
    }
    case REQUEST_EVENT_COMMENTS: {
      const { order, orderDir, summitTZ } = payload;
      return {
        ...state,
        commentState: { ...state.commentState, order, orderDir, summitTZ }
      };
    }
    case RECEIVE_EVENT_COMMENTS: {
      const { current_page, total, last_page } = payload.response;

      const items = payload.response.data.map((e) => ({
        ...e,
        owner_full_name: `${e.creator.first_name} ${e.creator.last_name}`,
        created: moment(e.created * MILLISECONDS_IN_SECOND)
          .tz(state.commentState.summitTZ)
          .format("MMMM Do YYYY, h:mm a"),
        last_edited: moment(e.last_edited * MILLISECONDS_IN_SECOND)
          .tz(state.commentState.summitTZ)
          .format("MMMM Do YYYY, h:mm a"),
        is_activity:
          e.is_activity === null
            ? "N/A"
            : e.is_activity === true
            ? "Yes"
            : "No",
        is_public:
          e.is_public === null ? "N/A" : e.is_public === true ? "Yes" : "No"
      }));

      return {
        ...state,
        commentState: {
          ...state.commentState,
          comments: items,
          currentPage: current_page,
          totalComments: total,
          lastPage: last_page
        }
      };
    }
    case EVENT_COMMENT_DELETED: {
      const { commentId } = payload;
      return {
        ...state,
        commentState: {
          ...state.commentState,
          comments: state.commentState.comments.filter(
            (e) => e.id !== commentId
          )
        }
      };
    }
    case RECEIVE_ACTION_TYPES: {
      const { data } = payload.response;
      return { ...state, actionTypes: data };
    }
    case FLAG_CHANGED: {
      const { entity } = state;
      const action = payload.response;

      // remove action if present
      const tmpActions = entity.actions.filter(
        (ac) => ac.type_id !== action.type_id
      );

      if (action.is_completed) {
        tmpActions.push(action);
      }

      return { ...state, entity: { ...entity, actions: tmpActions } };
    }
    default:
      return state;
  }
};

export default summitEventReducer;
