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

import T from "i18n-react/dist/i18n-react";
import {
  getRequest,
  postRequest,
  createAction,
  stopLoading,
  startLoading,
  authErrorHandler,
  escapeFilterValue,
  putRequest,
  deleteRequest,
  showSuccessMessage
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";

export const REQUEST_REGISTRATION_COMPANIES = "REQUEST_REGISTRATION_COMPANIES";
export const RECEIVE_REGISTRATION_COMPANIES = "RECEIVE_REGISTRATION_COMPANIES";
export const ADD_REGISTRATION_COMPANY = "ADD_REGISTRATION_COMPANY";
export const REGISTRATION_COMPANY_ADDED = "REGISTRATION_COMPANY_ADDED";
export const REGISTRATION_COMPANY_DELETED = "REGISTRATION_COMPANY_DELETED";
export const REGISTRATION_COMPANIES_IMPORTED =
  "REGISTRATION_COMPANIES_IMPORTED";

/**************************   REGISTRATION COMPANIES   ******************************************/

export const getRegistrationCompanies =
  (term = null, page = 1, perPage = 10, order = "id", orderDir = 1) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];

    dispatch(startLoading());

    const params = {
      page: page,
      per_page: perPage,
      access_token: accessToken
    };

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm}`);
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    return getRequest(
      createAction(REQUEST_REGISTRATION_COMPANIES),
      createAction(RECEIVE_REGISTRATION_COMPANIES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/registration-companies`,
      authErrorHandler,
      { page, perPage, order, orderDir, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const addRegistrationCompany =
  (entity) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    putRequest(
      createAction(ADD_REGISTRATION_COMPANY),
      createAction(REGISTRATION_COMPANY_ADDED)({ entity }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/registration-companies/${entity.id}`,
      null,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        showSuccessMessage(
          T.translate("registration_companies.registration_company_saved")
        )
      );
    });
    return;
  };

export const deleteRegistrationCompany =
  (companyId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(REGISTRATION_COMPANY_DELETED)({ companyId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/registration-companies/${companyId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const importRegistrationCompaniesCSV =
  (file) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    postRequest(
      null,
      createAction(REGISTRATION_COMPANIES_IMPORTED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/registration-companies/csv`,
      file,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
      window.location.reload();
    });
  };

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };
  return normalizedEntity;
};
