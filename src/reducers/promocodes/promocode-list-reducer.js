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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_PROMOCODES,
  RECEIVE_PROMOCODE_META,
  REQUEST_PROMOCODES,
  PROMOCODE_DELETED
} from "../../actions/promocode-actions";

import { ALL_FILTER } from "../../utils/constants";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const FILTERS_DEFAULT_STATE = {
  assigneeFilter: null,
  creatorFilter: null,
  typeFilter: null,
  classNamesFilter: [],
  tagsFilter: [],
  orAndFilter: ALL_FILTER
};

const DEFAULT_STATE = {
  promocodes: [],
  tags: [],
  term: null,
  filters: { ...FILTERS_DEFAULT_STATE },
  classNames: [],
  type: "ALL",
  assignee: null,
  creator: null,
  order: "code",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalPromocodes: 0,
  allTypes: ["ALL"],
  allClasses: [],
  extraColumns: []
};

// eslint-disable-next-line default-param-last
const promocodeListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_PROMOCODES: {
      const { order, orderDir, term, filters, extraColumns } = payload;

      return { ...state, order, orderDir, term, filters, extraColumns };
    }
    case RECEIVE_PROMOCODE_META: {
      let types = [...DEFAULT_STATE.allTypes];
      const allClasses = [...DEFAULT_STATE.allClasses, ...payload.response];

      payload.response
        .filter((t) => t.hasOwnProperty("type"))
        .forEach((t) => {
          types = types.concat(t.type);
        });

      const unique_types = [...new Set(types)];

      return { ...state, allTypes: unique_types, allClasses };
    }
    case RECEIVE_PROMOCODES: {
      const { current_page, total, last_page } = payload.response;
      const promocodes = payload.response.data.map((p) => {
        let owner = "";
        let owner_email = "";

        switch (p.class_name) {
          case "MEMBER_DISCOUNT_CODE":
          case "MEMBER_PROMO_CODE":
            if (p.owner) {
              owner = `${p.owner.first_name} ${p.owner.last_name}`;
              owner_email = p.owner.email;
            } else {
              owner =
                p.first_name && p.last_name
                  ? `${p.first_name} ${p.last_name}`
                  : "";
              owner_email = p.email ? p.email : "";
            }
            break;
          case "SPEAKER_DISCOUNT_CODE":
          case "SPEAKER_PROMO_CODE":
            if (p.speaker) {
              owner = `${p.speaker.first_name} ${p.speaker.last_name}`;
              owner_email = p.speaker.email;
            }
            break;
          case "SPEAKERS_DISCOUNT_CODE":
          case "SPEAKERS_PROMO_CODE":
            if (p.owners?.length > 0) {
              owner_email = p.owners.map((o) => o.speaker.email).join(", ");
            }
            break;
          case "SPONSOR_DISCOUNT_CODE":
          case "SPONSOR_PROMO_CODE":
            owner = p.sponsor?.company?.name || "";
            owner_email = p.contact_email || "";
            break;
          default:
            break;
        }

        return {
          id: p.id,
          class_name: p.class_name,
          description: p.description ? p.description : "N/A",
          code: p.code,
          type: p.type,
          tags:
            p.tags && p.tags.length > 0
              ? p.tags.reduce(
                  (accumulator, t) =>
                    accumulator + (accumulator !== "" ? ", " : "") + t.tag,
                  ""
                )
              : "N/A",
          owner,
          owner_email: owner_email || "",
          email_sent: p.email_sent ? "Yes" : "No",
          redeemed: p.redeemed ? "Yes" : "No",
          creator: p.hasOwnProperty("creator")
            ? `${p?.creator?.first_name} ${p?.creator?.last_name}`
            : "TBD"
        };
      });

      return {
        ...state,
        promocodes,
        currentPage: current_page,
        totalPromocodes: total,
        lastPage: last_page
      };
    }
    case PROMOCODE_DELETED: {
      const { promocodeId } = payload;
      return {
        ...state,
        promocodes: state.promocodes.filter((p) => p.id !== promocodeId)
      };
    }
    default:
      return state;
  }
};

export default promocodeListReducer;
