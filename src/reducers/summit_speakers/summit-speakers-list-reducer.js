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

import {
    REQUEST_SPEAKERS_BY_SUMMIT,
    RECEIVE_SPEAKERS_BY_SUMMIT,
    ATTENDANCE_DELETED,
    SELECT_SUMMIT_SPEAKER,
    UNSELECT_SUMMIT_SPEAKER,
    SELECT_ALL_SUMMIT_SPEAKERS,
    UNSELECT_ALL_SUMMIT_SPEAKERS,
    SEND_SPEAKERS_EMAILS,
    SET_SPEAKERS_CURRENT_FLOW_EVENT
} from '../../actions/speaker-actions';

import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/actions';
import { formatEpoch } from 'openstack-uicore-foundation/lib/methods'

const DEFAULT_STATE = {
    speakers: [],
    term: null,
    order: '',
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalSpeakers: 0,
    selectedSpeakers: [],
    selectedAll: false,
    selectionPlanFilter: [],
    trackFilter: [],
    activityTypeFilter: [],
    selectionStatusFilter: [],
    currentFlowEvent: '',
};

const summitSpeakersListReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action
    switch (type) {
        case LOGOUT_USER: {
            return state;
        }
            break;
        case REQUEST_SPEAKERS_BY_SUMMIT: {
            let { order, orderDir, term, page, perPage, ...rest } = payload;
            return { ...state, order, orderDir, term, currentPage: page, perPage, ...rest }
        }
            break;
        case RECEIVE_SPEAKERS_BY_SUMMIT: {
            let { current_page, total, last_page } = payload.response;

            let speakers = payload.response.data.map(s => ({
                ...s,
                name: `${s.first_name} ${s.last_name}`,
            }));

            return {
                ...state,
                speakers: speakers,
                currentPage: current_page,
                totalSpeakers: total,
                lastPage: last_page,
            };
        }
            break;
        case ATTENDANCE_DELETED: {
            let { attendanceId } = payload;
            return { ...state, attendances: state.attendances.filter(a => a.id !== attendanceId) };
        }
            break;
        case SELECT_SUMMIT_SPEAKER: {
            return { ...state, selectedSpeakers: [...state.selectedSpeakers, payload] }
        }
            break;
        case UNSELECT_SUMMIT_SPEAKER: {
            return { ...state, selectedSpeakers: state.selectedSpeakers.filter(e => e !== payload), selectedAll: false }
        }
            break;
        case SELECT_ALL_SUMMIT_SPEAKERS: {
            return { ...state, selectedAll: true }
        }
            break;
        case UNSELECT_ALL_SUMMIT_SPEAKERS: {
            return { ...state, selectedAll: false }
        }
            break;
        case SEND_SPEAKERS_EMAILS: {
            return {
                ...state,
                selectedSpeakers: [],
                currentFlowEvent: '',
                selectedAll: false
            }
        }
            break;
        case SET_SPEAKERS_CURRENT_FLOW_EVENT: {
            return { ...state, currentFlowEvent: payload };
        }
            break;
        default:
            return state;
    }
};

export default summitSpeakersListReducer;
