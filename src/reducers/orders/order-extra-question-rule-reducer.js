/**
 * Copyright 2018 OpenStack Foundation
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
    RESET_ORDER_EXTRA_QUESTION_SUB_QUESTION_FORM,
    UPDATE_ORDER_EXTRA_QUESTION_SUB_QUESTION,    
    RECEIVE_ORDER_EXTRA_QUESTION_SUB_QUESTION
} from '../../actions/order-actions';

import { LOGOUT_USER, VALIDATE } from 'openstack-uicore-foundation/lib/actions';
// import { SET_CURRENT_SUMMIT } from '../../actions/summit-actions';

export const DEFAULT_ENTITY = {
    id: 0,
    visibility: false,
    visibility_condition: false,
    answer_values: [],
    answer_custom_value: '',
    answer_values_operator: '',
    sub_question_id: null
}

const DEFAULT_STATE = {
    entity: DEFAULT_ENTITY,
    errors: {},
};

const orderExtraQuestionRuleReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action
    switch (type) {
        case LOGOUT_USER: {
            // we need this in case the token expired while editing the form
            if (payload.hasOwnProperty('persistStore')) {
                return state;
            } else {
                return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
            }
        }
            break;        
        case RESET_ORDER_EXTRA_QUESTION_SUB_QUESTION_FORM: {
            return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
        }
            break;
        case UPDATE_ORDER_EXTRA_QUESTION_SUB_QUESTION: {
            return { ...state, entity: { ...payload }, errors: {} };
        }
            break;
        case RECEIVE_ORDER_EXTRA_QUESTION_SUB_QUESTION: {
            let entity = { ...payload.response };

            for (var key in entity) {
                if (entity.hasOwnProperty(key)) {
                    entity[key] = (entity[key] == null) ? '' : entity[key];
                }
            }

            return { ...state, entity: { ...DEFAULT_ENTITY, ...entity } };
        }
            break;
        case VALIDATE: {
            return { ...state, errors: payload.errors };
        }
            break;
        default:
            return state;
    }
};

export default orderExtraQuestionRuleReducer;
