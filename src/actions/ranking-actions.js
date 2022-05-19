/**
 * Copyright 2022 OpenStack Foundation
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

export const RECEIVE_RATING_TYPE = 'RECEIVE_RATING_TYPE';
export const RESET_RATING_TYPE_FORM = 'RESET_RATING_TYPE_FORM';
export const UPDATE_RATING_TYPE = 'UPDATE_RATING_TYPE';
export const RATING_TYPE_UPDATED = 'RATING_TYPE_UPDATED';
export const RATING_TYPE_ADDED = 'RATING_TYPE_ADDED';

export const getRatingType = (ratingTypeId) => (dispatch, getState) => {

    const {loggedUserState, currentSummitState} = getState();
    const {accessToken} = loggedUserState;
    const {currentSummit} = currentSummitState;

    dispatch(startLoading());

    const params = {
        access_token: accessToken,
        expand: 'score_types,selection_plan'
    };

    return getRequest(
        null,
        createAction(RECEIVE_RATING_TYPE),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/track-chair-rating-types/${ratingTypeId}`,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const resetRatingTypeForm = () => (dispatch, getState) => {
    dispatch(createAction(RESET_RATING_TYPE_FORM)({}));
};

export const saveRatingType = (entity) => (dispatch, getState) => {

    const {loggedUserState, currentSummitState, currentSelectionPlanState} = getState();
    const {accessToken} = loggedUserState;
    const {currentSummit} = currentSummitState;
    const currentSelectionPlan = currentSelectionPlanState.entity;

    dispatch(startLoading());

    const normalizedEntity = normalizeEntity(entity);

    if (entity.id) {
        putRequest(
            createAction(UPDATE_RATING_TYPE),
            createAction(RATING_TYPE_UPDATED),
            `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${currentSelectionPlan.id}/track-chair-rating-types/${entity.id}?access_token=${accessToken}`,
            normalizedEntity,
            authErrorHandler,
            entity
        )({})(dispatch)
            .then((payload) => {
                dispatch(showSuccessMessage(T.translate("edit_rating_type.rating_type_saved")));
            });

    } else {
        const success_message = {
            title: T.translate("general.done"),
            html: T.translate("edit_rating_type.rating_type_created"),
            type: 'success'
        };

        postRequest(
            createAction(UPDATE_RATING_TYPE),
            createAction(RATING_TYPE_ADDED),
            `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${currentSelectionPlan.id}/track-chair-rating-types?access_token=${accessToken}`,
            normalizedEntity,
            authErrorHandler,
            entity
        )({})(dispatch)
            .then((payload) => {
                dispatch(showMessage(
                    success_message,
                    () => {
                        history.push(`/app/summits/${currentSummit.id}/selection-plans/${payload.response.id}`)
                    }
                ));
            });
    }
}

const normalizeEntity = (entity) => {
    const normalizedEntity = {...entity};

    delete(normalizedEntity['id']);
    delete(normalizedEntity['created']);
    delete(normalizedEntity['modified']);

    return normalizedEntity;
};