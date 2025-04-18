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

import {
  LOGOUT_USER,
  VALIDATE
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  RECEIVE_BADGE_SCAN,
  BADGE_SCAN_UPDATED,
  RESET_BADGE_SCAN_FORM
} from "../../actions/sponsor-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  notes: "",
  sponsor_extra_questions: [],
  extra_questions: [],
  attendee_full_name: "",
  attendee_company: "",
  scanned_on: "",
  scanned_by: ""
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {}
};

const badgeScanReducer = (state = DEFAULT_STATE, action) => {
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
    case RESET_BADGE_SCAN_FORM:
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case RECEIVE_BADGE_SCAN: {
      const badgeScan = payload.response;
      const scannedByEmail = badgeScan.scanned_by?.email
        ? `(${badgeScan.scanned_by?.email})`
        : "";
      const scannedBy = `${badgeScan.scanned_by?.first_name} ${badgeScan.scanned_by?.last_name} ${scannedByEmail}`;

      const newBadgeScan = { ...DEFAULT_ENTITY };

      newBadgeScan.id = badgeScan.id;
      newBadgeScan.notes = badgeScan.notes;
      newBadgeScan.extra_questions = badgeScan.extra_questions;
      newBadgeScan.scanned_by = scannedBy;

      if (
        badgeScan.badge.ticket.owner.first_name &&
        badgeScan.badge.ticket.owner.last_name
      ) {
        newBadgeScan.attendee_full_name = `${badgeScan.badge.ticket.owner.first_name} ${badgeScan.badge.ticket.owner.last_name}`;
      } else if (
        badgeScan.badge.ticket.owner.member?.first_name &&
        badgeScan.badge.ticket.owner.member?.last_name
      ) {
        newBadgeScan.attendee_full_name = `${badgeScan.badge.ticket.owner.member.first_name} ${badgeScan.badge.ticket.owner.member.last_name}`;
      }
      if (badgeScan.badge.ticket.owner.company) {
        newBadgeScan.attendee_company = badgeScan.badge.ticket.owner.company;
      } else if (badgeScan.badge.ticket.owner.member?.company) {
        newBadgeScan.attendee_company =
          badgeScan.badge.ticket.owner.member?.company;
      }
      newBadgeScan.sponsor_extra_questions = badgeScan.sponsor?.extra_questions;

      return { ...state, entity: { ...newBadgeScan } };
    }
    case BADGE_SCAN_UPDATED: {
      const badgeScan = payload.response;
      // only editable field that could change is notes and extra questions answers
      const { notes, extra_questions } = badgeScan;
      return { ...state, entity: { ...state.entity, notes, extra_questions } };
    }
    case VALIDATE:
      return { ...state, errors: payload.errors };
    default:
      return state;
  }
};

export default badgeScanReducer;
