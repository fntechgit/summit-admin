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

import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_BADGE_SCANS,
  RECEIVE_SPONSORS_WITH_SCANS,
  REQUEST_BADGE_SCANS
} from "../../actions/sponsor-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  badgeScans: [],
  sponsorId: null,
  term: "",
  order: "attendee_last_name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalBadgeScans: 0,
  allSponsors: [],
  summitTZ: ""
};

const badgeScansListReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_BADGE_SCANS: {
      const { term, order, orderDir, sponsorId, summitTZ } = payload;
      return { ...state, term, order, orderDir, sponsorId, summitTZ };
    }
    case RECEIVE_BADGE_SCANS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;
      const badgeScans = payload.response.data.map((s) => {
        const scanDate = epochToMomentTimeZone(
          s.scan_date || s.created,
          state.summitTZ
        ).format("MMMM Do YYYY, h:mm:ss a");
        const scannedByEmail = s.scanned_by?.email
          ? `(${s.scanned_by?.email})`
          : "";
        const scannedBy = `${s.scanned_by?.first_name} ${s.scanned_by?.last_name} ${scannedByEmail}`;
        let firstName = "";
        let lastName = "";
        let company = "";
        let email = "";

        if (s?.badge?.ticket?.owner) {
          firstName =
            s.badge.ticket.owner.member?.first_name ||
            s.badge.ticket.owner.first_name ||
            "";
          lastName =
            s.badge.ticket.owner.member?.last_name ||
            s.badge.ticket.owner.last_name ||
            "";
          email = s.badge.ticket.owner.email;
          company = s.badge.ticket.owner.company || "N/A";
        }

        if (s?.attendee_first_name) {
          firstName = s.attendee_first_name;
          lastName = s.attendee_last_name;
          email = s.attendee_email;
          company = s?.attendee_company || "N/A";
        }

        return {
          id: s.id,
          attendee_first_name: firstName,
          attendee_last_name: lastName,
          attendee_email: email,
          scan_date: scanDate,
          scanned_by: scannedBy,
          attendee_company: company
        };
      });

      return {
        ...state,
        badgeScans,
        currentPage,
        totalBadgeScans: total,
        lastPage
      };
    }
    case RECEIVE_SPONSORS_WITH_SCANS: {
      const { current_page, data } = payload.response;

      const allSponsors =
        current_page === 1 ? data : [...state.allSponsors, ...data];

      return { ...state, allSponsors };
    }
    default:
      return state;
  }
};

export default badgeScansListReducer;
