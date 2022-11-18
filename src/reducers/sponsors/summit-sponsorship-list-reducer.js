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
    RECEIVE_SUMMIT_SPONSORSHIPS,
    REQUEST_SUMMIT_SPONSORSHIPS,
    SUMMIT_SPONSORSHIP_DELETED,
} from '../../actions/sponsor-actions';

import {SET_CURRENT_SUMMIT} from "../../actions/summit-actions";
import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/utils/actions';

const DEFAULT_STATE = {
    sponsorships            : [],
    order               : 'name',
    orderDir            : 1,
    totalSponsorships       : 0
};

const summitSponsorshipListReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action
    switch (type) {
        case SET_CURRENT_SUMMIT:
        case LOGOUT_USER: {
            return DEFAULT_STATE;
        }
        case REQUEST_SUMMIT_SPONSORSHIPS: {
            let {order, orderDir} = payload;

            return {...state, order, orderDir }
        }
        case RECEIVE_SUMMIT_SPONSORSHIPS: {
            let { total } = payload.response;
            let sponsorships = payload.response.data;

            sponsorships.map(s => {
                s.sponsorship_type = s.type?.name;
                s.label = s.type?.label;
                s.size = s.type?.size;
                s.widget_title = s.widget_title ? s.widget_title : 'N/A'
            })

            return {...state, sponsorships: sponsorships, totalSponsorships: total };
        }
        case SUMMIT_SPONSORSHIP_DELETED: {
            let {sponsorshipId} = payload;
            return {...state, sponsorships: state.sponsorships.filter(t => t.id !== sponsorshipId)};
        }
        default:
            return state;
    }
};

export default summitSponsorshipListReducer;
