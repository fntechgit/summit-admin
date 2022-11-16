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
 **/

import
{
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
    SPONSOR_SOCIAL_NETWORK_ADDED
} from '../../actions/sponsor-actions';

import { VALIDATE } from 'openstack-uicore-foundation/lib/utils/actions';
import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/security/actions';
import { SET_CURRENT_SUMMIT } from '../../actions/summit-actions';

export const DEFAULT_ENTITY = {
    id                                  : 0,
    company                             : null,
    sponsorship_id                      : null,
    members                             : [],
    order                               : 0,
    is_published                        : false,
    intro                               : '',
    featured_event_id                   : '',
    marquee                             : '',
    external_link                       : '',
    video_link                          : '',
    chat_link                           : '',
    header_image                        : '',
    header_image_alt_text               : '',
    side_image                          : '',
    side_image_alt_text                 : '',
    header_image_mobile                 : '',
    header_image_mobile_alt_text        : '',
    carousel_advertise_image            : '',
    carousel_advertise_image_alt_text   : '',
    ads                                 : [],
    materials                           : [],
    social_networks                     : []
}

const DEFAULT_STATE = {
    entity      : DEFAULT_ENTITY,
    errors      : {}
};

const sponsorReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action
    switch (type) {
        case LOGOUT_USER: {
            // we need this in case the token expired while editing the form
            if (payload.hasOwnProperty('persistStore')) {
                return state;
            } else {
                return {...state,  entity: {...DEFAULT_ENTITY}, errors: {} };
            }
        }
        break;
        case SET_CURRENT_SUMMIT:
        case RESET_SPONSOR_FORM: {
            return {...state,  entity: {...DEFAULT_ENTITY}, errors: {} };
        }
        break;
        case UPDATE_SPONSOR: {
            return {...state,  entity: {...payload}, errors: {} };
        }
        break;
        case SPONSOR_ADDED:
        case RECEIVE_SPONSOR: {
            let entity = {...payload.response};

            for(var key in entity) {
                if(entity.hasOwnProperty(key)) {
                    entity[key] = (entity[key] == null) ? '' : entity[key] ;
                }
            }

            const sponsorship_id = entity.sponsorship.id;

            return {...state, entity: {...state.entity, ...entity, sponsorship_id} };
        }
        break;
        case SPONSOR_UPDATED: {
            return state;
        }
        break;
        case MEMBER_ADDED_TO_SPONSOR: {
            let {member} = payload;
            return {...state, entity: {...state.entity, members: [...state.entity.members, member] } };
        }
        break;
        case MEMBER_REMOVED_FROM_SPONSOR: {
            let {memberId} = payload;
            let currentMembers = state.entity.members.filter(m => m.id !== memberId);
            return {...state, entity: {...state.entity, members: currentMembers } };
        }
        break;
        case HEADER_IMAGE_ATTACHED: {            
            const header_image = payload.response.url;
            return {...state, entity: {...state.entity, header_image }}
        }
        break;
        case HEADER_IMAGE_DELETED: {
            return {...state, entity: {...state.entity, header_image: ''}}
        }
        break;
        case HEADER_MOBILE_IMAGE_ATTACHED: {            
            const header_image_mobile = payload.response.url;
            return {...state, entity: {...state.entity, header_image_mobile }}
        }
        break;
        case HEADER_MOBILE_IMAGE_DELETED: {
            return {...state, entity: {...state.entity, header_image: ''}}
        }
        break;
        case SIDE_IMAGE_ATTACHED: {
            const side_image = payload.response.url;
            return {...state, entity: {...state.entity, side_image }}
        }
        break;
        case SIDE_IMAGE_DELETED: {
            return {...state, entity: {...state.entity, side_image: ''}}
        }
        break;
        case CAROUSEL_IMAGE_ATTACHED: {            
            const carousel_advertise_image = payload.response.url;
            return {...state, entity: {...state.entity, carousel_advertise_image }}
        }
        break;
        case CAROUSEL_IMAGE_DELETED: {
            return {...state, entity: {...state.entity, carousel_advertise_image: ''}}
        }
        break;
        case RECEIVE_SPONSOR_ADVERTISEMENTS: {
            const ads = payload.response.data;
            return {...state, entity: {...state.entity, ads }}
        }
        break;
        case SPONSOR_ADVERTISEMENT_ADDED: {
            const newAdvertisement = payload.response;
            return {...state, entity: {...state.entity, ads: [...state.entity.ads, newAdvertisement] }}
        }
        break;
        case SPONSOR_ADVERTISEMENT_UPDATED: {
            const updatedAdvertisement = payload.response;
            const ads = state.entity.ads.filter(ad => ad.id !== updatedAdvertisement.id)
            return {...state, entity: {...state.entity, ads: [...ads, updatedAdvertisement] }}
        }
        break;
        case SPONSOR_ADVERTISEMENT_DELETED: {
            const {advertisementId} = payload
            const ads = state.entity.ads.filter(ad => ad.id !== advertisementId)
            return {...state, entity: {...state.entity, ads }}
        }
        break;
        case RECEIVE_SPONSOR_MATERIALS: {      
            const materials = payload.response.data;
            return {...state, entity: {...state.entity, materials }}
        }
        break;
        case SPONSOR_MATERIAL_ADDED: {
            const newMaterial = payload.response;
            return {...state, entity: {...state.entity, materials: [...state.entity.materials, newMaterial] }}
        }
        break;
        case SPONSOR_MATERIAL_UPDATED: {
            const updatedMaterial = payload.response;
            const materials = state.entity.materials.filter(material => material.id !== updatedMaterial.id)
            return {...state, entity: {...state.entity, materials: [...materials, updatedMaterial] }}
        }
        break;
        case SPONSOR_MATERIAL_DELETED: {
            const {materialId} = payload
            const materials = state.entity.materials.filter(material => material.id !== materialId)
            return {...state, entity: {...state.entity, materials }}
        }
        case RECEIVE_SPONSOR_SOCIAL_NETWORKS: {
            const social_networks = payload.response.data;
            return {...state, entity: {...state.entity, social_networks }}
        }
        break;
        case SPONSOR_SOCIAL_NETWORK_ADDED: {
            const newSocialNetwork = payload.response;
            return {...state, entity: {...state.entity, social_networks: [...state.entity.social_networks, newSocialNetwork] }}
        }
        break;
        case SPONSOR_SOCIAL_NETWORK_UPDATED: {
            const updatedSocialNetwork = payload.response;
            const social_networks = state.entity.social_networks.filter(social_network => social_network.id !== updatedSocialNetwork.id)
            return {...state, entity: {...state.entity, social_networks: [...social_networks, updatedSocialNetwork] }}
        }
        break;
        case SPONSOR_SOCIAL_NETWORK_DELETED: {
            const {socialNetWorkId} = payload
            const social_networks = state.entity.social_networks.filter(social_network => social_network.id !== socialNetWorkId)
            return {...state, entity: {...state.entity, social_networks }}
        }
        case VALIDATE: {
            return {...state,  errors: payload.errors };
        }
        break;
        default:
            return state;
    }
};

export default sponsorReducer;
