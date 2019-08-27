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

import T from "i18n-react/dist/i18n-react";
import history from '../history'
import {
    getRequest,
    putRequest,
    postRequest,
    deleteRequest,
    createAction,
    stopLoading,
    startLoading,
    showMessage,
    showSuccessMessage,
    authErrorHandler
} from 'openstack-uicore-foundation/lib/methods';


export const REQUEST_ORDER_EXTRA_QUESTIONS       = 'REQUEST_ORDER_EXTRA_QUESTIONS';
export const RECEIVE_ORDER_EXTRA_QUESTIONS       = 'RECEIVE_ORDER_EXTRA_QUESTIONS';
export const RECEIVE_ORDER_EXTRA_QUESTION        = 'RECEIVE_ORDER_EXTRA_QUESTION';
export const RESET_ORDER_EXTRA_QUESTION_FORM     = 'RESET_ORDER_EXTRA_QUESTION_FORM';
export const UPDATE_ORDER_EXTRA_QUESTION         = 'UPDATE_ORDER_EXTRA_QUESTION';
export const ORDER_EXTRA_QUESTION_UPDATED        = 'ORDER_EXTRA_QUESTION_UPDATED';
export const ORDER_EXTRA_QUESTION_ADDED          = 'ORDER_EXTRA_QUESTION_ADDED';
export const ORDER_EXTRA_QUESTION_DELETED        = 'ORDER_EXTRA_QUESTION_DELETED';
export const RECEIVE_ORDER_EXTRA_QUESTION_META   = 'RECEIVE_ORDER_EXTRA_QUESTION_META';
export const QUESTION_VALUE_ORDER_UPDATED        = 'QUESTION_VALUE_ORDER_UPDATED';
export const ORDER_EXTRA_QUESTION_VALUE_DELETED  = 'ORDER_EXTRA_QUESTION_VALUE_DELETED';
export const ORDER_EXTRA_QUESTION_VALUE_ADDED    = 'ORDER_EXTRA_QUESTION_VALUE_ADDED';
export const ORDER_EXTRA_QUESTION_VALUE_UPDATED  = 'ORDER_EXTRA_QUESTION_VALUE_UPDATED';
export const RECEIVE_ORDER_EXTRA_QUESTION_VALUE  = 'RECEIVE_ORDER_EXTRA_QUESTION_VALUE';
export const RESET_ORDER_EXTRA_QUESTION_VALUE_FORM  = 'RESET_ORDER_EXTRA_QUESTION_VALUE_FORM';
export const UPDATE_ORDER_EXTRA_QUESTION_VALUE   = 'UPDATE_ORDER_EXTRA_QUESTION_VALUE';
export const ORDER_EXTRA_QUESTION_ORDER_UPDATED   = 'ORDER_EXTRA_QUESTION_ORDER_UPDATED';



export const REQUEST_PURCHASE_ORDERS = 'REQUEST_PURCHASE_ORDERS';
export const RECEIVE_PURCHASE_ORDERS = 'RECEIVE_PURCHASE_ORDERS';
export const RECEIVE_PURCHASE_ORDER = 'RECEIVE_PURCHASE_ORDER';



/***********************  ORDER EXTRA QUESTIONS  *******************************************/

export const getOrderExtraQuestionMeta = () => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    let params = {
        access_token : accessToken,
    };

    return getRequest(
        null,
        createAction(RECEIVE_ORDER_EXTRA_QUESTION_META),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/metadata`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};


export const getOrderExtraQuestions = () => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    let params = {
        page         : 1,
        per_page     : 100,
        order        : '+order',
        access_token : accessToken,
    };

    return getRequest(
        createAction(REQUEST_ORDER_EXTRA_QUESTIONS),
        createAction(RECEIVE_ORDER_EXTRA_QUESTIONS),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const getOrderExtraQuestion = (orderExtraQuestionId) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    let params = {
        access_token : accessToken,
    };

    return getRequest(
        null,
        createAction(RECEIVE_ORDER_EXTRA_QUESTION),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const resetOrderExtraQuestionForm = () => (dispatch, getState) => {
    dispatch(createAction(RESET_ORDER_EXTRA_QUESTION_FORM)({}));
};

export const saveOrderExtraQuestion = (entity) => (dispatch, getState) => {
    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    let params = {
        access_token : accessToken,
    };

    dispatch(startLoading());

    let normalizedEntity = normalizeQuestion(entity);

    if (entity.id) {

        putRequest(
            createAction(UPDATE_ORDER_EXTRA_QUESTION),
            createAction(ORDER_EXTRA_QUESTION_UPDATED),
            `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${entity.id}`,
            normalizedEntity,
            authErrorHandler,
            entity
        )(params)(dispatch)
            .then((payload) => {
                dispatch(showSuccessMessage(T.translate("edit_order_extra_question.order_extra_question_saved")));
            });

    } else {
        let success_message = {
            title: T.translate("general.done"),
            html: T.translate("edit_order_extra_question.order_extra_question_created"),
            type: 'success'
        };

        postRequest(
            createAction(UPDATE_ORDER_EXTRA_QUESTION),
            createAction(ORDER_EXTRA_QUESTION_ADDED),
            `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions`,
            normalizedEntity,
            authErrorHandler,
            entity
        )(params)(dispatch)
            .then((payload) => {
                dispatch(showMessage(
                    success_message,
                    () => { history.push(`/app/summits/${currentSummit.id}/order-extra-questions/${payload.response.id}`) }
                ));
            });
    }
}

export const deleteOrderExtraQuestion = (orderExtraQuestionId) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    let params = {
        access_token : accessToken
    };

    return deleteRequest(
        null,
        createAction(ORDER_EXTRA_QUESTION_DELETED)({orderExtraQuestionId}),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};


export const updateOrderExtraQuestionOrder = (questions, questionId, newOrder) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    let params = {
        access_token : accessToken
    };

    let question = questions.find(q => q.id == questionId);

    putRequest(
        null,
        createAction(ORDER_EXTRA_QUESTION_ORDER_UPDATED)(questions),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${questionId}`,
        question,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );

}


export const saveOrderExtraQuestionValue = (orderExtraQuestionId, entity) => (dispatch, getState) => {
    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    let params = {
        access_token : accessToken,
    };

    if (entity.id) {

        let success_message = {
            title: T.translate("general.done"),
            html: T.translate("edit_order_extra_question.order_extra_question_value_saved"),
            type: 'success'
        };

        putRequest(
            createAction(UPDATE_ORDER_EXTRA_QUESTION_VALUE),
            createAction(ORDER_EXTRA_QUESTION_VALUE_UPDATED),
            `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}/values/${entity.id}`,
            entity,
            authErrorHandler,
            entity
        )(params)(dispatch)
            .then((payload) => {
                dispatch(showMessage(
                    success_message,
                    () => { history.push(`/app/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}`) }
                ));
            });

    } else {

        let success_message = {
            title: T.translate("general.done"),
            html: T.translate("edit_order_extra_question.order_extra_question_value_created"),
            type: 'success'
        };

        postRequest(
            createAction(UPDATE_ORDER_EXTRA_QUESTION_VALUE),
            createAction(ORDER_EXTRA_QUESTION_VALUE_ADDED),
            `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}/values`,
            entity,
            authErrorHandler,
            entity
        )(params)(dispatch)
            .then((payload) => {
                dispatch(showMessage(
                    success_message,
                    () => { history.push(`/app/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}`) }
                ));
            });
    }
}

export const deleteOrderExtraQuestionValue = (orderExtraQuestionId, orderExtraQuestionValueId) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    let params = {
        access_token : accessToken
    };

    return deleteRequest(
        null,
        createAction(ORDER_EXTRA_QUESTION_VALUE_DELETED)({orderExtraQuestionValueId}),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}/values/${orderExtraQuestionValueId}`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};



const normalizeQuestion = (entity) => {
    let normalizedEntity = {...entity};


    return normalizedEntity;

}



/***************************  PURCHASE ORDERS  ******************************/

export const getPurchaseOrders = ( term = null, page = 1, perPage = 10, order = 'id', orderDir = 1 ) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;
    let filter = [];

    dispatch(startLoading());

    if(term){
        filter.push(`first_name=@${term},last_name=@${term},email=@${term}`);
    }

    let params = {
        expand       : 'member, tickets, schedule_summit_events',
        page         : page,
        per_page     : perPage,
        access_token : accessToken,
    };

    if(filter.length > 0){
        params['filter[]']= filter;
    }

    // order
    if(order != null && orderDir != null){
        let orderDirSign = (orderDir == 1) ? '+' : '-';
        params['order']= `${orderDirSign}${order}`;
    }


    return getRequest(
        createAction(REQUEST_PURCHASE_ORDERS),
        createAction(RECEIVE_PURCHASE_ORDERS),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders`,
        authErrorHandler,
        {page, perPage, order, orderDir, term}
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const getPurchaseOrder = (orderId) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    let params = {
        expand       : 'member, speaker, tickets, rsvp, schedule_summit_events, all_affiliations',
        access_token : accessToken,
    };

    return getRequest(
        null,
        createAction(RECEIVE_PURCHASE_ORDER),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${orderId}`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};
