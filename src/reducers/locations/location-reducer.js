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
 **/

import
{
    RECEIVE_LOCATION,
    RECEIVE_LOCATION_META,
    RESET_LOCATION_FORM,
    UPDATE_LOCATION,
    LOCATION_UPDATED,
    LOCATION_GMAP_UPDATED,
    LOCATION_ADDRESS_UPDATED
} from '../../actions/location-actions';

import { LOGOUT_USER } from '../../actions/auth-actions';
import { VALIDATE } from '../../actions/base-actions';
import { SET_CURRENT_SUMMIT } from '../../actions/summit-actions';

export const DEFAULT_ENTITY = {
    id                  : 0,
    name                : '',
    class_name          : '',
    description         : '',
    location_type       : '',
    type                : '',
    address_1           : '',
    address_2           : '',
    zipcode             : '',
    city                : '',
    state               : '',
    country             : '',
    website             : '',
    lng                 : '',
    lat                 : '',
    display_on_site     : false,
    details_page        : false,
    is_main             : false,
    location_message    : '',
    maps                : [],
    images              : [],
    rooms               : [],
    floors              : [],
    capacity            : 0,
    booking_link        : '',
    sold_out            : false,

}

const DEFAULT_STATE = {
    entity      : DEFAULT_ENTITY,
    errors      : {},
    allClasses  : []
};

const locationReducer = (state = DEFAULT_STATE, action) => {
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
        case RESET_LOCATION_FORM: {
            return {...state,  entity: {...DEFAULT_ENTITY}, errors: {} };
        }
        break;
        case RECEIVE_LOCATION_META: {
            let allClasses = [...payload.response];

            return {...state, allClasses: allClasses }
        }
        break;
        case UPDATE_LOCATION: {
            return {...state,  entity: {...payload}, errors: {} };
        }
        break;
        case RECEIVE_LOCATION: {
            let entity = {...payload.response};

            for(var key in entity) {
                if(entity.hasOwnProperty(key)) {
                    entity[key] = (entity[key] == null) ? '' : entity[key] ;
                }
            }

            return {...state, entity: {...DEFAULT_ENTITY, ...entity} };
        }
        break;
        case LOCATION_UPDATED: {
            return state;
        }
        break;
        case LOCATION_GMAP_UPDATED: {
            let {location} = payload[0].geometry;
            return {...state, entity: {...state.entity, lat: location.lat(), lng: location.lng()}};
        }
        break;
        case LOCATION_ADDRESS_UPDATED: {
            let address = payload[0].address_components;
            let {location} = payload[0].geometry;

            return {...state, entity: {
                ...state.entity,
                address_1: address[0].short_name + ' ' + address[1].short_name,
                city: address[3].short_name,
                state: address[4].short_name,
                country: address[5].short_name,
                lat: location.lat(),
                lng: location.lng()
            }};
        }
        break;
        case VALIDATE: {
            return {...state,  errors: payload.errors };
        }
        break;
        default:
            return state;
    }
};

export default locationReducer;
