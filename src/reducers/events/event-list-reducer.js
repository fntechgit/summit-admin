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

import moment from 'moment-timezone';
import momentDurationFormatSetup from 'moment-duration-format';

momentDurationFormatSetup(moment);

import
{
    RECEIVE_EVENTS,
    REQUEST_EVENTS,
    EVENT_DELETED,
    CHANGE_SEARCH_TERM,
    UPDATED_REMOTE_EVENTS,
} from '../../actions/event-actions';

import {SET_CURRENT_SUMMIT} from "../../actions/summit-actions";
import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/security/actions';
import { FILTER_CRITERIA_ADDED, FILTER_CRITERIA_DELETED } from '../../actions/filter-criteria-actions';


const DEFAULT_STATE = {
    events          : {},
    term            : null,
    order           : 'id',
    orderDir        : 1,
    currentPage     : 1,
    lastPage        : 1,
    perPage         : 10,
    totalEvents     : 0,
    summitTZ        : '',
    filters         : {},
    extraColumns    : [],
};

const eventListReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action
    switch (type) {
        case SET_CURRENT_SUMMIT:
        case LOGOUT_USER: {
            return DEFAULT_STATE;
        }
        case REQUEST_EVENTS: {
            let {order, orderDir, term, summitTZ, filters, extraColumns} = payload;

            return {...state, order, orderDir, term, summitTZ, filters, extraColumns}
        }
        case RECEIVE_EVENTS: {
            let {current_page, total, last_page} = payload.response;
            return {...state, events: payload.response.data, currentPage: current_page, totalEvents: total, lastPage: last_page };
        }
        case EVENT_DELETED: {
            let {eventId} = payload;
            return {...state, events: state.events.filter(e => e.id !== eventId)};
        }
        case CHANGE_SEARCH_TERM: {
            let {term} = payload;
            return {...state, term};
        }
        case UPDATED_REMOTE_EVENTS:
        default:
            return state;
    }
};

export default eventListReducer;
