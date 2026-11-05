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
 * */

import T from "i18n-react/dist/i18n-react";
import {
  getRequest,
  postRequest,
  createAction,
  stopLoading,
  startLoading,
  escapeFilterValue,
  putRequest,
  deleteRequest,
  snackbarErrorHandler,
  snackbarSuccessHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely, sequenced } from "../utils/methods";
import { DEFAULT_PER_PAGE } from "../utils/constants";

export const REQUEST_REGISTRATION_COMPANIES = "REQUEST_REGISTRATION_COMPANIES";
export const RECEIVE_REGISTRATION_COMPANIES = "RECEIVE_REGISTRATION_COMPANIES";
export const ADD_REGISTRATION_COMPANY = "ADD_REGISTRATION_COMPANY";
export const REGISTRATION_COMPANY_ADDED = "REGISTRATION_COMPANY_ADDED";
export const REGISTRATION_COMPANY_DELETED = "REGISTRATION_COMPANY_DELETED";
export const REGISTRATION_COMPANIES_IMPORTED =
  "REGISTRATION_COMPANIES_IMPORTED";

/* *************************   REGISTRATION COMPANIES   ***************************************** */

const registrationCompaniesSeq = sequenced();

export const getRegistrationCompanies =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "name",
    orderDir = 1
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    const filter = [];
    const { isCurrent, guardedDispatch } = registrationCompaniesSeq(dispatch);

    guardedDispatch(startLoading());

    const accessToken = await getAccessTokenSafely();

    if (!isCurrent()) return Promise.resolve();

    const params = {
      page,
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

    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_REGISTRATION_COMPANIES),
      createAction(RECEIVE_REGISTRATION_COMPANIES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/registration-companies`,
      snackbarErrorHandler,
      { page, perPage, order, orderDir, term }
    )(params)(guardedDispatch)
      .catch(() => {})
      .finally(() => {
        guardedDispatch(stopLoading());
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

    return putRequest(
      createAction(ADD_REGISTRATION_COMPANY),
      createAction(REGISTRATION_COMPANY_ADDED)({ entity }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/registration-companies/${entity.id}`,
      null,
      snackbarErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate(
              "registration_companies.registration_company_saved"
            )
          })
        );
      })
      .catch(() => {});
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
      snackbarErrorHandler
    )(params)(dispatch)
      .catch(() => {})
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const importRegistrationCompaniesCSV =
  (file) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const accessToken = await getAccessTokenSafely();

    const params = {
      access_token: accessToken
    };

    return postRequest(
      null,
      createAction(REGISTRATION_COMPANIES_IMPORTED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/registration-companies/csv`,
      file,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        window.location.reload();
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  };
