/**
 * Copyright 2020 OpenStack Foundation
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
    RECEIVE_INVITATIONS,
    REQUEST_INVITATIONS,
    SELECT_INVITATION,
    UNSELECT_INVITATION,
    CLEAR_ALL_SELECTED_INVITATIONS,
    REGISTRATION_INVITATION_DELETED,
    REGISTRATION_INVITATION_ALL_DELETED,
    SET_CURRENT_FLOW_EVENT,
    SET_SELECTED_ALL,
    SEND_INVITATIONS_EMAILS
} from '../../actions/registration-invitation-actions';

import {SET_CURRENT_SUMMIT} from "../../actions/summit-actions";
import {LOGOUT_USER} from 'openstack-uicore-foundation/lib/utils/actions';
import { map } from 'lodash';
import { MaxTextLengthForTicketTypesOnTable } from '../../utils/constants';

const DEFAULT_STATE = {
    invitations: [],
    term: null,
    order: 'id',
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalInvitations: 0,
    showNonAccepted: false,
    showNotSent: false,
    selectedInvitationsIds: [],
    currentFlowEvent: '',
    selectedAll: false,
    allowedTicketTypesIds: [],
};

const RegistrationInvitationListReducer = (state = DEFAULT_STATE, action) => {
    const {type, payload} = action;
    switch (type) {
        case SET_CURRENT_SUMMIT:
        case LOGOUT_USER: {
            return DEFAULT_STATE;
        }
        case REQUEST_INVITATIONS: {
            let {order, orderDir, page, perPage, term, showNonAccepted, showNotSent, allowedTicketTypesIds} = payload;

            return {...state, order, orderDir, currentPage: page, perPage, term, showNonAccepted, showNotSent, allowedTicketTypesIds};
        }
        case RECEIVE_INVITATIONS: {
            let {total, last_page, data} = payload.response;
            data = data.map(i => {
                
                const allowedTicketTypes = i.allowed_ticket_types?.length > 0 ? 
                    i.allowed_ticket_types.map(t => t.name).join(', ') : 'N/A';

                return {...i, 
                    is_accepted: i.is_accepted ? "Yes" : "No", 
                    is_sent: i.is_sent ? "Yes" : "No", 
                    allowed_ticket_types: allowedTicketTypes.slice(0, MaxTextLengthForTicketTypesOnTable),
                    allowed_ticket_types_full: allowedTicketTypes
                }
            });
            return {...state, invitations: data, lastPage: last_page, totalInvitations: total};
        }
        case SELECT_INVITATION:{
            return {...state, selectedInvitationsIds: [...state.selectedInvitationsIds, payload], allowedTicketTypesIds: []};
        }
        case UNSELECT_INVITATION:{
            return {...state, selectedInvitationsIds: state.selectedInvitationsIds.filter(element => element !== payload), 
                allowedTicketTypesIds: [], selectedAll: false};
        }
        case CLEAR_ALL_SELECTED_INVITATIONS:
        {
            return {...state, selectedInvitationsIds: [], allowedTicketTypesIds: [], selectedAll: false};
        }
        case SEND_INVITATIONS_EMAILS:
        {
            return {...state, selectedInvitationsIds: [], allowedTicketTypesIds: [], selectedAll: false, currentFlowEvent: ''};
        }
        case REGISTRATION_INVITATION_DELETED: {
            return {...state, invitations: state.invitations.filter(i => i.id !== payload)};
        }
        case REGISTRATION_INVITATION_ALL_DELETED: {
            return {...state, invitations:[]};
        }
        case SET_CURRENT_FLOW_EVENT:{
            return {...state, currentFlowEvent : payload};
        }
        case SET_SELECTED_ALL:{
            return {...state, selectedAll : payload, selectedInvitationsIds: [], allowedTicketTypesIds: []};
        }
        default:
            return state;
    }
};

export default RegistrationInvitationListReducer;
