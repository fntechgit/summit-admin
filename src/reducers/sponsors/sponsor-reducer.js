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

import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";

import {
  RECEIVE_SPONSOR,
  RESET_SPONSOR_FORM,
  UPDATE_SPONSOR,
  SPONSOR_UPDATED,
  SPONSOR_ADDED,
  MEMBER_ADDED_TO_SPONSOR,
  MEMBER_REMOVED_FROM_SPONSOR,
  RECEIVE_SPONSOR_ADVERTISEMENTS,
  SPONSOR_ADVERTISEMENT_DELETED,
  RECEIVE_SPONSOR_MATERIALS,
  SPONSOR_MATERIAL_DELETED,
  RECEIVE_SPONSOR_SOCIAL_NETWORKS,
  SPONSOR_SOCIAL_NETWORK_DELETED,
  HEADER_IMAGE_ATTACHED,
  HEADER_IMAGE_DELETED,
  SIDE_IMAGE_ATTACHED,
  SIDE_IMAGE_DELETED,
  CAROUSEL_IMAGE_ATTACHED,
  CAROUSEL_IMAGE_DELETED,
  HEADER_MOBILE_IMAGE_ATTACHED,
  HEADER_MOBILE_IMAGE_DELETED,
  SPONSOR_SOCIAL_NETWORK_UPDATED,
  SPONSOR_MATERIAL_UPDATED,
  SPONSOR_ADVERTISEMENT_UPDATED,
  SPONSOR_ADVERTISEMENT_ADDED,
  SPONSOR_MATERIAL_ADDED,
  SPONSOR_SOCIAL_NETWORK_ADDED,
  SPONSOR_ADS_ORDER_UPDATED,
  SPONSOR_MATERIAL_ORDER_UPDATED,
  SPONSOR_EXTRA_QUESTION_ORDER_UPDATED,
  SPONSOR_EXTRA_QUESTION_DELETED,
  SPONSOR_EXTRA_QUESTION_ADDED,
  SPONSOR_EXTRA_QUESTION_UPDATED,
  RECEIVE_SPONSOR_LEAD_REPORT_SETTINGS_META,
  SPONSOR_LEAD_REPORT_SETTINGS_UPDATED,
  TIER_ADD_TO_SPONSOR,
  REQUEST_SPONSOR_SPONSORSHIPS,
  RECEIVE_SPONSOR_SPONSORSHIPS
} from "../../actions/sponsor-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  denormalizeLeadReportSettings,
  renderOptions
} from "../../models/lead-report-settings";

const DEFAULT_ADS_STATE = {
  ads: [],
  order: "order",
  orderDir: 1,
  perPage: 100,
  totalAds: 0
};

const DEFAULT_MATERIALS_STATE = {
  materials: [],
  order: "order",
  orderDir: 1,
  perPage: 100,
  totalAds: 0
};

const DEFAULT_SOCIAL_NETWORKS_STATE = {
  social_networks: [],
  order: "order",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 5,
  totalAds: 0
};

const DEFAULT_SPONSORHIPS_STATE = {
  sponsorships: [],
  order: "order",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 5,
  totalSponsorships: 0
};

export const DEFAULT_ENTITY = {
  id: 0,
  company: null,
  sponsorship: null,
  members: [],
  order: 0,
  is_published: false,
  intro: "",
  featured_event: { id: 0 },
  marquee: "",
  external_link: "",
  video_link: "",
  chat_link: "",
  header_image: "",
  header_image_alt_text: "",
  side_image: "",
  side_image_alt_text: "",
  header_image_mobile: "",
  header_image_mobile_alt_text: "",
  carousel_advertise_image: "",
  carousel_advertise_image_alt_text: "",
  ads_collection: DEFAULT_ADS_STATE,
  materials_collection: DEFAULT_MATERIALS_STATE,
  social_networks_collection: DEFAULT_SOCIAL_NETWORKS_STATE,
  extra_questions: [],
  lead_report_setting: {},
  available_lead_report_columns: [],
  sponsorships_collection: DEFAULT_SPONSORHIPS_STATE
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {}
};

const sponsorReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case SET_CURRENT_SUMMIT:
    case RESET_SPONSOR_FORM:
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };

    case UPDATE_SPONSOR:
      return { ...state, entity: { ...payload }, errors: {} };
    case SPONSOR_ADDED:
    case RECEIVE_SPONSOR: {
      const entity = { ...payload.response };

      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      if (!entity.lead_report_setting) entity.lead_report_setting = {};

      return {
        ...state,
        entity: { ...state.entity, ...entity }
      };
    }
    case SPONSOR_UPDATED:
      return state;
    case MEMBER_ADDED_TO_SPONSOR: {
      const { member } = payload;
      return {
        ...state,
        entity: {
          ...state.entity,
          members: [...state.entity.members, member]
        }
      };
    }
    case MEMBER_REMOVED_FROM_SPONSOR: {
      const { memberId } = payload;
      const currentMembers = state.entity.members.filter(
        (m) => m.id !== memberId
      );
      return {
        ...state,
        entity: { ...state.entity, members: currentMembers }
      };
    }
    case HEADER_IMAGE_ATTACHED: {
      const header_image = payload.response.url;
      return { ...state, entity: { ...state.entity, header_image } };
    }
    case HEADER_IMAGE_DELETED:
      return { ...state, entity: { ...state.entity, header_image: "" } };
    case HEADER_MOBILE_IMAGE_ATTACHED: {
      const header_image_mobile = payload.response.url;
      return { ...state, entity: { ...state.entity, header_image_mobile } };
    }
    case HEADER_MOBILE_IMAGE_DELETED:
      return { ...state, entity: { ...state.entity, header_image: "" } };
    case SIDE_IMAGE_ATTACHED: {
      const side_image = payload.response.url;
      return { ...state, entity: { ...state.entity, side_image } };
    }
    case SIDE_IMAGE_DELETED:
      return { ...state, entity: { ...state.entity, side_image: "" } };
    case CAROUSEL_IMAGE_ATTACHED: {
      const carousel_advertise_image = payload.response.url;
      return {
        ...state,
        entity: { ...state.entity, carousel_advertise_image }
      };
    }
    case CAROUSEL_IMAGE_DELETED: {
      return {
        ...state,
        entity: { ...state.entity, carousel_advertise_image: "" }
      };
    }
    case RECEIVE_SPONSOR_ADVERTISEMENTS: {
      const { total } = payload.response;
      const ads = payload.response.data;
      return {
        ...state,
        entity: { ...state.entity, ads_collection: { ads, total } }
      };
    }
    case SPONSOR_ADS_ORDER_UPDATED: {
      return {
        ...state,
        entity: {
          ...state.entity,
          ads_collection: { ...state.entity.ads_collection, ads: payload }
        }
      };
    }
    case SPONSOR_ADVERTISEMENT_ADDED: {
      const newAdvertisement = payload.response;
      return {
        ...state,
        entity: {
          ...state.entity,
          ads_collection: {
            ...state.entity.ads_collection,
            ads: [...state.entity.ads_collection.ads, newAdvertisement]
          }
        }
      };
    }
    case SPONSOR_ADVERTISEMENT_UPDATED: {
      const updatedAdvertisement = payload.response;
      const ads = state.entity.ads_collection.ads.filter(
        (ad) => ad.id !== updatedAdvertisement.id
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          ads_collection: {
            ...state.entity.ads_collection,
            ads: [...ads, updatedAdvertisement]
          }
        }
      };
    }
    case SPONSOR_ADVERTISEMENT_DELETED: {
      const { advertisementId } = payload;
      const ads = state.entity.ads_collection.ads.filter(
        (ad) => ad.id !== advertisementId
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          ads_collection: { ...state.entity.ads_collection, ads }
        }
      };
    }
    case RECEIVE_SPONSOR_MATERIALS: {
      const { total } = payload.response;
      const materials = payload.response.data;
      return {
        ...state,
        entity: {
          ...state.entity,
          materials_collection: { materials, total }
        }
      };
    }
    case SPONSOR_MATERIAL_ORDER_UPDATED: {
      return {
        ...state,
        entity: {
          ...state.entity,
          materials_collection: {
            ...state.entity.materials_collection,
            materials: payload
          }
        }
      };
    }
    case SPONSOR_MATERIAL_ADDED: {
      const newMaterial = payload.response;
      return {
        ...state,
        entity: {
          ...state.entity,
          materials_collection: {
            ...state.entity.materials_collection,
            materials: [
              ...state.entity.materials_collection.materials,
              newMaterial
            ]
          }
        }
      };
    }
    case SPONSOR_MATERIAL_UPDATED: {
      const updatedMaterial = payload.response;
      const materials = state.entity.materials_collection.materials.filter(
        (material) => material.id !== updatedMaterial.id
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          materials_collection: {
            ...state.entity.materials_collection,
            materials: [...materials, updatedMaterial]
          }
        }
      };
    }
    case SPONSOR_MATERIAL_DELETED: {
      const { materialId } = payload;
      const materials = state.entity.materials_collection.materials.filter(
        (material) => material.id !== materialId
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          materials_collection: {
            ...state.entity.materials_collection,
            materials
          }
        }
      };
    }
    case RECEIVE_SPONSOR_SOCIAL_NETWORKS: {
      const { current_page, per_page, total, last_page } = payload.response;
      const social_networks = payload.response.data.map((social_network) => ({
        ...social_network,
        is_enabled: social_network.is_enabled ? "True" : "False"
      }));
      return {
        ...state,
        entity: {
          ...state.entity,
          social_networks_collection: {
            social_networks,
            currentPage: current_page,
            lastPage: last_page,
            total,
            perPage: per_page
          }
        }
      };
    }
    case SPONSOR_SOCIAL_NETWORK_ADDED: {
      const newSocialNetwork = payload.response;
      return {
        ...state,
        entity: {
          ...state.entity,
          social_networks_collection: {
            ...state.entity.social_networks_collection,
            social_networks: [
              ...state.entity.social_networks_collection.social_networks,
              newSocialNetwork
            ]
          }
        }
      };
    }
    case SPONSOR_SOCIAL_NETWORK_UPDATED: {
      const updatedSocialNetwork = {
        ...payload.response,
        is_enabled: payload.response.is_enabled ? "True" : "False"
      };
      let social_networks =
        state.entity.social_networks_collection.social_networks.filter(
          (social_network) => social_network.id !== updatedSocialNetwork.id
        );
      social_networks = social_networks.map((social_network) => ({
        ...social_network,
        is_enabled: social_network.is_enabled ? "True" : "False"
      }));
      return {
        ...state,
        entity: {
          ...state.entity,
          social_networks_collection: {
            ...state.entity.social_networks_collection,
            social_networks: [...social_networks, updatedSocialNetwork]
          }
        }
      };
    }
    case SPONSOR_SOCIAL_NETWORK_DELETED: {
      const { socialNetWorkId } = payload;
      const social_networks =
        state.entity.social_networks_collection.social_networks.filter(
          (social_network) => social_network.id !== socialNetWorkId
        );
      return {
        ...state,
        entity: {
          ...state.entity,
          social_networks_collection: {
            ...state.entity.social_networks_collection,
            social_networks
          }
        }
      };
    }
    case SPONSOR_EXTRA_QUESTION_ORDER_UPDATED: {
      return {
        ...state,
        entity: { ...state.entity, extra_questions: payload }
      };
    }
    case SPONSOR_EXTRA_QUESTION_DELETED: {
      const { questionId } = payload;
      const extraQuestions = state.entity.extra_questions.filter(
        (eq) => eq.id !== questionId
      );
      return {
        ...state,
        entity: { ...state.entity, extra_questions: extraQuestions }
      };
    }
    case VALIDATE: {
      return { ...state, errors: payload.errors };
    }
    case SPONSOR_EXTRA_QUESTION_ADDED: {
      const new_extra_question = { ...payload.response };
      return {
        ...state,
        entity: {
          ...state.entity,
          extra_questions: [...state.entity.extra_questions, new_extra_question]
        }
      };
    }
    case SPONSOR_EXTRA_QUESTION_UPDATED: {
      const updated_extra_question = { ...payload.response };
      const extra_questions = state.entity.extra_questions.filter(
        (q) => q.id !== updated_extra_question.id
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          extra_questions: [...extra_questions, updated_extra_question]
        }
      };
    }
    case RECEIVE_SPONSOR_LEAD_REPORT_SETTINGS_META: {
      const availableColumns = renderOptions(
        denormalizeLeadReportSettings(payload.response)
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          available_lead_report_columns: availableColumns
        }
      };
    }
    case SPONSOR_LEAD_REPORT_SETTINGS_UPDATED: {
      return {
        ...state,
        entity: { ...state.entity, lead_report_setting: payload.response }
      };
    }
    case REQUEST_SPONSOR_SPONSORSHIPS: {
      const { order, orderDir } = payload;
      return {
        ...state,
        sponsorships_collection: {
          order,
          orderDir
        }
      };
    }
    case RECEIVE_SPONSOR_SPONSORSHIPS: {
      const { current_page, per_page, total, last_page, data } =
        payload.response;
      let newSponsorships = [];

      if (data.length > 0) {
        newSponsorships = data.map((s) => ({ ...s, tier: s.type?.type.name }));
      }

      return {
        ...state,
        entity: {
          ...state.entity,
          sponsorships_collection: {
            sponsorships: newSponsorships,
            currentPage: current_page,
            perPage: per_page,
            lastPage: last_page,
            totalSponsorships: total
          }
        }
      };
    }
    case TIER_ADD_TO_SPONSOR: {
      console.log("CHECK PAYLOAD", payload);
      return { ...state };
    }
    default:
      return state;
  }
};

export default sponsorReducer;
