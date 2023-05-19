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
import React from "react";
import
{
    RESET_TRACK_TIMEFRAME_FORM,
    RECEIVE_TRACK_TIMEFRAME,
    UPDATE_TRACK_TIMEFRAME,
    TRACK_TIMEFRAME_UPDATED,
    TRACK_TIMEFRAME_ADDED,
    TRACK_TIMEFRAME_DELETED_LOC,
    TRACK_TIMEFRAME_DELETED_DAY,
} from '../../actions/track-timeframes-actions';

import { VALIDATE } from 'openstack-uicore-foundation/lib/utils/actions';
import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/security/actions';
import {SET_CURRENT_SUMMIT} from "../../actions/summit-actions";

export const DEFAULT_ENTITY = {
    id: 0,
    proposed_schedule_allowed_locations: []
}

const DEFAULT_STATE = {
    entity: DEFAULT_ENTITY,
    errors: {}
};
const trackTimeframeReducer = (state = DEFAULT_STATE, action) => {
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
        case RESET_TRACK_TIMEFRAME_FORM: {
            return {...state,  entity: {...DEFAULT_ENTITY}, errors: {} };
        }
        case RECEIVE_TRACK_TIMEFRAME: {
            const track = {...payload.response};
            
            return {...state, entity: track, errors: {} };
        }
        case UPDATE_TRACK_TIMEFRAME: {
            return {...state,  entity: {...payload }, errors: {} };
        }
        case TRACK_TIMEFRAME_UPDATED: {
            let entity = {...payload.response};

            return {
                ...state,
                entity: {
                    owner: {
                        email: entity.owner_email,
                        first_name: entity.owner_first_name,
                        last_name: entity.owner_last_name,
                    },
                    ...entity,
                    tickets: assembleTicketsState(entity.tickets)
                },
                errors: {}
            }
        }
        case TRACK_TIMEFRAME_ADDED: {
            let entity = {...payload.response};
            console.log(payload);
            return {...state}
        }
        case VALIDATE: {
            return {...state,  errors: payload.errors };
        }
        default:
            return state;
    }
};

export default trackTimeframeReducer;
