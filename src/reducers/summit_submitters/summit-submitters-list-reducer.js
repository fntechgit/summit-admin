/**
 * Copyright 2023 OpenStack Foundation
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

import {
    INIT_SUBMITTERS_LIST_PARAMS,
    REQUEST_SUBMITTERS_BY_SUMMIT,
    RECEIVE_SUBMITTERS_BY_SUMMIT,
    SELECT_SUMMIT_SUBMITTER,
    UNSELECT_SUMMIT_SUBMITTER,
    SELECT_ALL_SUMMIT_SUBMITTERS,
    UNSELECT_ALL_SUMMIT_SUBMITTERS,
    SEND_SUBMITTERS_EMAILS,
    SET_SUBMITTERS_CURRENT_FLOW_EVENT
} from '../../actions/submitter-actions';

import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/security/actions';
import ReactTooltip from "react-tooltip";
import {REQUEST_SUMMIT, SET_CURRENT_SUMMIT} from "../../actions/summit-actions";

const DEFAULT_STATE = {
    items: [],
    term: null,
    order: 'full_name',
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalItems: 0,
    selectedItems: [],
    selectedAll: false,
    selectionPlanFilter: [],
    trackFilter: [],
    activityTypeFilter: [],
    selectionStatusFilter: [],
    currentFlowEvent: '',
    currentSummitId: null
};

const summitSubmittersListReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action
    switch (type) {
        case LOGOUT_USER:
        case REQUEST_SUMMIT:
        case SET_CURRENT_SUMMIT:
        case INIT_SUBMITTERS_LIST_PARAMS:
        {
            return DEFAULT_STATE;
        }
        case REQUEST_SUBMITTERS_BY_SUMMIT: {
            let { order, orderDir, term, page, perPage, ...rest } = payload;
            return { ...state, order, orderDir, term, currentPage: page, perPage, ...rest }
        }
        case RECEIVE_SUBMITTERS_BY_SUMMIT: {
            let { current_page, total, last_page } = payload.response;

            let items = payload.response.data.map(s => {

                const acceptedPresentationsToolTip = s.accepted_presentations.reduce(
                    (ac, ap) => ac +(ac !== '' ? '<br>':'') + `<a target="_blank" href="/app/summits/${state.currentSummitId}/events/${ap.id}">${ap.title}</a>`, ''
                );

                const rejectedPresentationsToolTip = s.rejected_presentations.reduce(
                    (ac, ap) => ac +(ac !== '' ? '<br>':'') + `<a target="_blank" href="/app/summits/${state.currentSummitId}/events/${ap.id}">${ap.title}</a>`, ''
                );

                const alternatePresentationsToolTip = s.alternate_presentations.reduce(
                    (ac, ap) => ac +(ac !== '' ? '<br>':'') + `<a target="_blank" href="/app/summits/${state.currentSummitId}/events/${ap.id}">${ap.title}</a>`, ''
                );

                return {
                ...s,
                    full_name: `${s.first_name} ${s.last_name}`,
                    accepted_presentations_count : s.accepted_presentations.length > 0 ?
                    <a data-tip={acceptedPresentationsToolTip} data-for={`accepted_${s.id}`}
                       onClick={ev => { ev.stopPropagation()}}
                       href="#">{s.accepted_presentations.length}
                        <ReactTooltip
                            delayHide={1000}
                            id={`accepted_${s.id}`}
                            multiline={true}
                            clickable={true}
                            border={true}
                            getContent={(dataTip) =>
                                <div className="tooltip-popover"
                                     dangerouslySetInnerHTML={{__html: dataTip}}
                                />
                            }
                            place='bottom'
                            type='light'
                            effect='solid'
                        />
                    </a>
                    : 'N/A',
                alternate_presentations_count :
                    s.alternate_presentations.length > 0 ?
                        <a data-tip={alternatePresentationsToolTip} data-for={`alternate_${s.id}`}
                           onClick={ev => { ev.stopPropagation()}}
                           href="#">{s.alternate_presentations.length}
                            <ReactTooltip
                                delayHide={1000}
                                id={`alternate_${s.id}`}
                                multiline={true}
                                clickable={true}
                                border={true}
                                getContent={(dataTip) =>
                                    <div className="tooltip-popover"
                                         dangerouslySetInnerHTML={{__html: dataTip}}
                                    />
                                }
                                place='bottom'
                                type='light'
                                effect='solid'
                            />
                        </a>
                        : 'N/A',
                rejected_presentations_count : s.rejected_presentations.length > 0 ?
                    <a data-tip={rejectedPresentationsToolTip} data-for={`rejected_${s.id}`}
                       onClick={ev => { ev.stopPropagation()}}
                       href="#">{s.rejected_presentations.length}
                        <ReactTooltip
                            delayHide={1000}
                            id={`rejected_${s.id}`}
                            multiline={true}
                            clickable={true}
                            border={true}
                            getContent={(dataTip) =>
                                <div className="tooltip-popover"
                                     dangerouslySetInnerHTML={{__html: dataTip}}
                                />
                            }
                            place='bottom'
                            type='light'
                            effect='solid'
                        /></a>
            : 'N/A'
            }});

            return {
                ...state,
                items: items,
                currentPage: current_page,
                totalItems: total,
                lastPage: last_page,
            };
        }
            break;
        case SELECT_SUMMIT_SUBMITTER: {
            return { ...state, selectedItems: [...state.selectedItems, payload], selectedAll: false }
        }
            break;
        case UNSELECT_SUMMIT_SUBMITTER: {
            return { ...state, selectedItems: state.selectedItems.filter(e => e !== payload), selectedAll: false }
        }
            break;
        case SELECT_ALL_SUMMIT_SUBMITTERS: {
            return { ...state, selectedAll: true, selectedItems:[] }
        }
            break;
        case UNSELECT_ALL_SUMMIT_SUBMITTERS: {
            return { ...state, selectedAll: false, selectedItems:[]  }
        }
            break;
        case SEND_SUBMITTERS_EMAILS: {
            return {
                ...state,
                selectedItems: [],
                currentFlowEvent: '',
                selectedAll: false
            }
        }
            break;
        case SET_SUBMITTERS_CURRENT_FLOW_EVENT: {
            return { ...state, currentFlowEvent: payload };
        }
            break;
        default:
            return state;
    }
};

export default summitSubmittersListReducer;
