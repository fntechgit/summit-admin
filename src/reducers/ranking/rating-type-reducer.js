/**
 * Copyright 2022 OpenStack Foundation
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
    RECEIVE_RATING_TYPE,
    RESET_RATING_TYPE_FORM,
    UPDATE_RATING_TYPE,
    RATING_TYPE_UPDATED,
    RATING_TYPE_ADDED,
    RATING_TYPE_DELETED,
} from '../../actions/rsvp-template-actions';

import { LOGOUT_USER, VALIDATE } from 'openstack-uicore-foundation/lib/actions';
import { SET_CURRENT_SUMMIT } from '../../actions/summit-actions';

export const DEFAULT_ENTITY = {
    id                  : 0,
    name                : '',
    weight              : 0,
    order               : 1,
    is_mandatory        : false,
}

const DEFAULT_STATE = {
    entity      : DEFAULT_ENTITY,
    errors      : {},
};

const ratingTypeReducer = (state = DEFAULT_STATE, action) => {
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
        case SET_CURRENT_SUMMIT:
        case RESET_RATING_TYPE_FORM: {
            return {...state,  entity: {...DEFAULT_ENTITY}, errors: {} };
        }
        case UPDATE_RATING_TYPE: {
            return {...state,  entity: {...payload}, errors: {} };
        }
        case RECEIVE_RATING_TYPE: {
            let entity = {...payload.response};

            for(var key in entity) {
                if(entity.hasOwnProperty(key)) {
                    entity[key] = (entity[key] == null) ? '' : entity[key] ;
                }
            }

            return {...state, entity: {...DEFAULT_ENTITY, ...entity} };
        }
        case RATING_TYPE_UPDATED: {
            return state;
        }
        case RATING_TYPE_ADDED: {
            let entity = {...payload.response};
            let values = [...state.entity.values, entity];

            return {...state, entity: { ...state.entity, values: values}};
        }
        case VALIDATE: {
            return {...state,  errors: payload.errors };
        }
        default:
            return state;
    }
};

export default ratingTypeReducer;
