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

export const REQUEST_TAX_TYPES       = 'REQUEST_TAX_TYPES';
export const RECEIVE_TAX_TYPES       = 'RECEIVE_TAX_TYPES';
export const RECEIVE_TAX_TYPE        = 'RECEIVE_TAX_TYPE';
export const RESET_TAX_TYPE_FORM     = 'RESET_TAX_TYPE_FORM';
export const UPDATE_TAX_TYPE         = 'UPDATE_TAX_TYPE';
export const TAX_TYPE_UPDATED        = 'TAX_TYPE_UPDATED';
export const TAX_TYPE_ADDED          = 'TAX_TYPE_ADDED';
export const TAX_TYPE_DELETED        = 'TAX_TYPE_DELETED';
export const TAX_TICKET_ADDED        = 'TAX_TICKET_ADDED';
export const TAX_TICKET_REMOVED      = 'TAX_TICKET_REMOVED';


export const getTaxTypes = ( order = 'name', orderDir = 1 ) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    let params = {
        page         : 1,
        per_page     : 100,
        access_token : accessToken,
        expand       : 'ticket_types'
    };

    // order
    if(order != null && orderDir != null){
        let orderDirSign = (orderDir == 1) ? '+' : '-';
        params['order']= `${orderDirSign}${order}`;
    }


    return getRequest(
        createAction(REQUEST_TAX_TYPES),
        createAction(RECEIVE_TAX_TYPES),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tax-types`,
        authErrorHandler,
        {order, orderDir}
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const getTaxType = (taxTypeId) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    let params = {
        access_token : accessToken,
        expand       : 'ticket_types'
    };

    return getRequest(
        null,
        createAction(RECEIVE_TAX_TYPE),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tax-types/${taxTypeId}`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const resetTaxTypeForm = () => (dispatch, getState) => {
    dispatch(createAction(RESET_TAX_TYPE_FORM)({}));
};

export const saveTaxType = (entity) => (dispatch, getState) => {
    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    let params = {
        access_token : accessToken,
    };

    dispatch(startLoading());

    let normalizedEntity = normalizeEntity(entity);

    if (entity.id) {

        putRequest(
            createAction(UPDATE_TAX_TYPE),
            createAction(TAX_TYPE_UPDATED),
            `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tax-types/${entity.id}`,
            normalizedEntity,
            authErrorHandler,
            entity
        )(params)(dispatch)
            .then((payload) => {
                dispatch(showSuccessMessage(T.translate("edit_tax_type.tax_type_saved")));
            });

    } else {
        let success_message = {
            title: T.translate("general.done"),
            html: T.translate("edit_tax_type.tax_type_created"),
            type: 'success'
        };

        postRequest(
            createAction(UPDATE_TAX_TYPE),
            createAction(TAX_TYPE_ADDED),
            `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tax-types`,
            normalizedEntity,
            authErrorHandler,
            entity
        )(params)(dispatch)
            .then((payload) => {
                dispatch(showMessage(
                    success_message,
                    () => { history.push(`/app/summits/${currentSummit.id}/tax-types/${payload.response.id}`) }
                ));
            });
    }
}

export const deleteTaxType = (taxTypeId) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    let params = {
        access_token : accessToken
    };

    return deleteRequest(
        null,
        createAction(TAX_TYPE_DELETED)({taxTypeId}),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tax-types/${taxTypeId}`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const addTicketToTaxType = (taxTypeId, ticket) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    let params = {
        access_token : accessToken
    };

    return putRequest(
        null,
        createAction(TAX_TICKET_ADDED)({ticket}),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tax-types/${taxTypeId}/ticket-types/${ticket.id}`,
        {},
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const removeTicketFromTaxType = (taxTypeId, ticketId) => (dispatch, getState) => {

    let { loggedUserState, currentSummitState } = getState();
    let { accessToken }     = loggedUserState;
    let { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    let params = {
        access_token : accessToken
    };

    return deleteRequest(
        null,
        createAction(TAX_TICKET_REMOVED)({ticketId}),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tax-types/${taxTypeId}/ticket-types/${ticketId}`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};


const normalizeEntity = (entity) => {
    let normalizedEntity = {...entity};

    return normalizedEntity;

}
