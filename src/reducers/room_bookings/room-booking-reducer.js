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
    RECEIVE_ROOM_BOOKING,
    RESET_ROOM_BOOKING_FORM,
    UPDATE_ROOM_BOOKING,
    ROOM_BOOKING_UPDATED,
    ROOM_BOOKING_ADDED
} from '../../actions/room-booking-actions';

import { LOGOUT_USER, VALIDATE } from 'openstack-uicore-foundation/lib/utils/actions';
import { SET_CURRENT_SUMMIT } from '../../actions/summit-actions';

export const DEFAULT_ENTITY = {
    id: 0,
    amount: 0,
    approved_payment_date: 0,
    currency: "USD",
    start_datetime: 0,
    end_datetime: 0,
    owner_id: 0,
    payment_gateway_client_token: null,
    room_id: 0,
    status: ""
}

const DEFAULT_STATE = {
    entity      : DEFAULT_ENTITY,
    errors      : {}
};

const roomBookingReducer = (state = DEFAULT_STATE, action) => {
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
        case RESET_ROOM_BOOKING_FORM: {
            return {...state,  entity: {...DEFAULT_ENTITY}, errors: {} };
        }
        break;
        case UPDATE_ROOM_BOOKING: {
            return {...state,  entity: {...payload}, errors: {} };
        }
        break;
        case ROOM_BOOKING_ADDED:
        case RECEIVE_ROOM_BOOKING: {
            let entity = {...payload.response};

            for(var key in entity) {
                if(entity.hasOwnProperty(key)) {
                    entity[key] = (entity[key] == null) ? '' : entity[key] ;
                }
            }

            return {...state, entity: {...DEFAULT_ENTITY, ...entity} };
        }
        break;
        case ROOM_BOOKING_UPDATED: {
            return state;
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

export default roomBookingReducer;
