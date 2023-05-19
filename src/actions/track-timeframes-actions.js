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
    getRequest,
    deleteRequest,
    postRequest,
    putRequest,
    createAction,
    stopLoading,
    startLoading,
    authErrorHandler, showMessage,
} from 'openstack-uicore-foundation/lib/utils/actions';
import {getAccessTokenSafely} from '../utils/methods';
import {SIGNAGE_BANNER_ADDED, SIGNAGE_BANNER_UPDATED, UPDATE_SIGNAGE_BANNER} from "./signage-actions";
import history from "../history";
import T from "i18n-react";
import {RECEIVE_EVENT_CATEGORIES, REQUEST_EVENT_CATEGORIES} from "./event-category-actions";
export const RECEIVE_TRACK_TIMEFRAMES       = 'RECEIVE_TRACK_TIMEFRAMES';
export const UPDATE_TRACK_TIMEFRAME        = 'UPDATE_TRACK_TIMEFRAME';
export const TRACK_TIMEFRAME_UPDATED        = 'TRACK_TIMEFRAME_UPDATED';
export const TRACK_TIMEFRAME_ADDED          = 'TRACK_TIMEFRAME_ADDED';
export const RESET_TRACK_TIMEFRAME_FORM          = 'RESET_TRACK_TIMEFRAME_FORM';
export const RECEIVE_TRACK_TIMEFRAME          = 'RECEIVE_TRACK_TIMEFRAME';
export const TRACK_TIMEFRAME_DELETED        = 'TRACK_TIMEFRAME_DELETED';
export const TRACK_TIMEFRAME_DELETED_LOC    = 'TRACK_TIMEFRAME_DELETED_LOC';
export const TRACK_TIMEFRAME_DELETED_DAY    = 'TRACK_TIMEFRAME_DELETED_DAY';


export const getTrackTimeframes = (page = 1, perPage = 10) => async (dispatch, getState) => {

    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    const params = {
        page: page,
        per_page: perPage,
        access_token: accessToken,
        expand: 'proposed_schedule_allowed_locations,proposed_schedule_allowed_locations.location',
        'filter[]': ['has_proposed_schedule_allowed_locations==true']
    };

    return getRequest(
        null,
        createAction(RECEIVE_TRACK_TIMEFRAMES),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tracks`,
        authErrorHandler,
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const getTrackTimeframe = (trackId) => async (dispatch, getState) => {
    
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit }   = currentSummitState;
    
    dispatch(startLoading());
    
    const params = {
        expand       : "proposed_schedule_allowed_locations,proposed_schedule_allowed_locations.location",
        access_token : accessToken,
    };
    
    return getRequest(
      null,
      createAction(RECEIVE_TRACK_TIMEFRAME),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tracks/${trackId}`,
      authErrorHandler
    )(params)(dispatch).then(() => {
          dispatch(stopLoading());
      }
    );
};


export const addTrackTimeframe = (member, trackIds) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit }   = currentSummitState;

    dispatch(startLoading());

    const params = {
        access_token : accessToken,
        expand       : 'member,categories'
    };

    return postRequest(
        null,
        createAction(TRACK_TIMEFRAME_ADDED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/track-chairs`,
        {member_id: member.id, categories: trackIds},
        authErrorHandler,
    )(params)(dispatch)
        .then(() => {
           dispatch(stopLoading());
        });
};


export const saveTrackTimeframe = (trackId, locationId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    
    const params = {
        access_token: accessToken,
    };
    
    dispatch(startLoading());
    
    const success_message = {
        title: T.translate("general.done"),
        html: T.translate("track_timeframes.timeframe_created"),
        type: 'success'
    };
    
    postRequest(
      createAction(UPDATE_TRACK_TIMEFRAME),
      createAction(TRACK_TIMEFRAME_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tracks/${trackId}/proposed-schedule-allowed-locations`,
      {location_id: locationId},
      authErrorHandler,
    )(params)(dispatch)
      .then((payload) => {
          dispatch(showMessage(
            success_message,
            () => { history.push(`/app/summits/${currentSummit.id}/track-chairs/track-timeframes/${payload.response.id}`) }
          ));
      });
}

export const deleteTrackTimeframe = (trackId) => async (dispatch, getState) => {

    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit }   = currentSummitState;

    const params = {
        access_token : accessToken
    };

    return deleteRequest(
        null,
        createAction(TRACK_TIMEFRAME_DELETED)({trackId}),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/track-chairs/timeframes/${trackId}`,
        null,
        authErrorHandler
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};


