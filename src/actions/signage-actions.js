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

import {
    getRequest,
    createAction,
    stopLoading,
    startLoading,
    authErrorHandler,
    escapeFilterValue,
    putRequest,
    postRequest,
    deleteRequest,
    fetchErrorHandler
} from 'openstack-uicore-foundation/lib/utils/actions';
import {getAccessTokenSafely} from '../utils/methods';

export const REQUEST_SIGN = 'REQUEST_SIGN';
export const RECEIVE_SIGN = 'RECEIVE_SIGN';
export const UPDATE_SIGN = 'UPDATE_SIGN';
export const SIGN_UPDATED = 'SIGN_UPDATED';
export const SIGN_ADDED = 'SIGN_ADDED';
export const REQUEST_SIGNAGE_EVENTS = 'REQUEST_SIGNAGE_EVENTS';
export const RECEIVE_SIGNAGE_EVENTS = 'RECEIVE_SIGNAGE_EVENTS';
export const RECEIVE_SIGNAGE_TEMPLATES = 'RECEIVE_SIGNAGE_TEMPLATES';
export const REQUEST_SIGNAGE_BANNERS = 'REQUEST_SIGNAGE_BANNERS';
export const RECEIVE_SIGNAGE_BANNERS = 'RECEIVE_SIGNAGE_BANNERS';
export const REQUEST_SIGNAGE_LOCATIONS = 'REQUEST_SIGNAGE_LOCATIONS';
export const RECEIVE_SIGNAGE_LOCATIONS = 'RECEIVE_SIGNAGE_LOCATIONS';
export const UPDATE_SIGNAGE_BANNER = 'UPDATE_SIGNAGE_BANNER';
export const SIGNAGE_BANNER_UPDATED = 'SIGNAGE_BANNER_UPDATED';
export const SIGNAGE_BANNER_ADDED = 'SIGNAGE_BANNER_ADDED';
export const SIGNAGE_BANNER_DELETED = 'SIGNAGE_BANNER_DELETED';
export const SIGNAGE_UPDATED = 'SIGNAGE_UPDATED';


export const getSign = (locationId) => async (dispatch, getState) => {
    
    const {currentSummitState} = getState();
    const accessToken = await getAccessTokenSafely();
    const {currentSummit} = currentSummitState;
    
    dispatch(startLoading());
    
    const params = {
        access_token: accessToken,
        'filter[]': [`location_id==${locationId}`]
    };
    
    return getRequest(
      createAction(REQUEST_SIGN),
      createAction(RECEIVE_SIGN),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/signs`,
      authErrorHandler,
      {}
    )(params)(dispatch).then(() => {
          dispatch(stopLoading());
      }
    );
};

export const saveSign = (entity) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    
    const params = {
        access_token: accessToken,
    };
    
    const normalizedSign = normalizeSign(entity);
    
    dispatch(startLoading());
    
    if (entity.id) {
        putRequest(
          createAction(UPDATE_SIGN),
          createAction(SIGN_UPDATED),
          `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/signs/${entity.id}`,
          normalizedSign,
          authErrorHandler,
          entity
        )(params)(dispatch)
          .then(() => {
              dispatch(stopLoading());
          });
        
    } else {
        postRequest(
          createAction(UPDATE_SIGN),
          createAction(SIGN_ADDED),
          `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/signs`,
          normalizedSign,
          authErrorHandler,
          entity
        )(params)(dispatch)
          .then((payload) => {
              dispatch(stopLoading());
          });
    }
}

export const getTemplates = () => async (dispatch, getState) => {
    const {currentSummitState} = getState();
    const accessToken = await getAccessTokenSafely();
    const {currentSummit} = currentSummitState;
    
    const response = await fetch(`${window.SIGNAGE_BASE_URL}/templates.json?access_token=${accessToken}`);
    if (response.ok) {
        const {fntech} = await response.json();
        const templates = fntech[currentSummit.id];
        dispatch(createAction(RECEIVE_SIGNAGE_TEMPLATES)({templates}))
    } else {
        fetchErrorHandler(response);
    }
};

export const getSignEvents = (locationId, term = '', page = 1, perPage = 10, order = null, orderDir = 1) => async (dispatch, getState) => {

    const {currentSummitState} = getState();
    const accessToken = await getAccessTokenSafely();
    const {currentSummit} = currentSummitState;
    const filter = [];
 
    dispatch(startLoading());

    if (term) {
        const escapedTerm = escapeFilterValue(term);
        filter.push(`user_full_name=@${escapedTerm},action=@${escapedTerm}`);
    }

    const params = {
        page: page,
        per_page: perPage,
        expand: 'speakers,location,location.floor',
        access_token: accessToken,
    };

    params['filter[]'] = filter;

    // order
    if (order != null && orderDir != null) {
        const orderDirSign = (orderDir === 1) ? '+' : '-';
        params['order'] = `${orderDirSign}${order}`;
    }
    
    return getRequest(
      createAction(REQUEST_SIGNAGE_EVENTS),
      createAction(RECEIVE_SIGNAGE_EVENTS),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/${locationId}/events/published`,
        authErrorHandler,
        {page, perPage, order, orderDir, term, locationId, summitTz: currentSummit.time_zone_id}
    )(params)(dispatch).then(() => {
            dispatch(stopLoading());
        }
    );
};

export const getSignBanners = (locationId, term = '', page = 1, perPage = 10, order = null, orderDir = 1) => async (dispatch, getState) => {
    
    const {currentSummitState} = getState();
    const accessToken = await getAccessTokenSafely();
    const {currentSummit} = currentSummitState;
    const filter = [];
    
    dispatch(startLoading());
    
    if (term) {
        const escapedTerm = escapeFilterValue(term);
        filter.push(`user_full_name=@${escapedTerm},action=@${escapedTerm}`);
    }
    
    const params = {
        page: page,
        per_page: perPage,
        expand: 'type,location,location.floor',
        access_token: accessToken,
    };
    
    params['filter[]'] = filter;
    
    // order
    if (order != null && orderDir != null) {
        const orderDirSign = (orderDir === 1) ? '+' : '-';
        params['order'] = `${orderDirSign}${order}`;
    }
    
    return getRequest(
      createAction(REQUEST_SIGNAGE_BANNERS),
      createAction(RECEIVE_SIGNAGE_BANNERS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/${locationId}/banners`,
      authErrorHandler,
      {page, perPage, order, orderDir, term, locationId, summitTz: currentSummit.time_zone_id}
    )(params)(dispatch).then(() => {
          dispatch(stopLoading());
      }
    );
};

export const getLocations = () => async (dispatch, getState) => {
    
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit }   = currentSummitState;
    
    dispatch(startLoading());
    
    const params = {
        expand       : 'rooms,floors',
        page         : 1,
        per_page     : 100,
        access_token : accessToken,
    };
    
    return getRequest(
      createAction(REQUEST_SIGNAGE_LOCATIONS),
      createAction(RECEIVE_SIGNAGE_LOCATIONS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations`,
      authErrorHandler
    )(params)(dispatch).then(() => {
          dispatch(stopLoading());
      }
    );
};

export const saveBanner = (entity) => async (dispatch, getState) => {
    const { currentSummitState, signageState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {locationId} = signageState;
    
    const params = {
        access_token: accessToken,
        expand: 'type,location,location.floor',
    };
    
    dispatch(startLoading());
    
    const normalizedEntity = normalizeBanner(entity);
    
    if (entity.id) {
        putRequest(
          createAction(UPDATE_SIGNAGE_BANNER),
          createAction(SIGNAGE_BANNER_UPDATED),
          `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/${locationId}/banners/${entity.id}`,
          normalizedEntity,
          authErrorHandler,
          entity
        )(params)(dispatch)
          .then(() => {
              dispatch(stopLoading());
          });
        
    } else {
        postRequest(
          createAction(UPDATE_SIGNAGE_BANNER),
          createAction(SIGNAGE_BANNER_ADDED),
          `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/${locationId}/banners`,
          normalizedEntity,
          authErrorHandler,
          entity
        )(params)(dispatch)
          .then((payload) => {
              dispatch(stopLoading());
          });
    }
}

export const deleteBanner = (id) => async (dispatch, getState) => {
    
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    
    const params = {
        access_token: accessToken
    };
    
    return deleteRequest(
      null,
      createAction(SIGNAGE_BANNER_DELETED)({ id }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/banners/${id}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
          dispatch(stopLoading());
      }
    );
};

export const jumpToBanner = (id) => async (dispatch, getState) => {
    const {currentSummitState} = getState();
    const accessToken = await getAccessTokenSafely();
    const {currentSummit} = currentSummitState;
    
    const params = {
        access_token: accessToken,
    };
    
    dispatch(startLoading());
    
    putRequest(
      null,
      createAction(SIGNAGE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/banners/${id}`,
      id,
      authErrorHandler,
    )(params)(dispatch)
      .then(() => {
          dispatch(stopLoading());
      });
};

const normalizeBanner = (entity) => {
    const normalizedEntity = {...entity};
    
    delete(normalizedEntity['id']);
    delete(normalizedEntity['created']);
    delete(normalizedEntity['modified']);
    
    return normalizedEntity;
}

const normalizeSign = (entity) => {
    const normalizedEntity = {...entity};
    
    delete(normalizedEntity['id']);
    
    return normalizedEntity;
}
