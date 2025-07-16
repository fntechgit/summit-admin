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
 * */

import {
  authErrorHandler,
  createAction,
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import T from "i18n-react/dist/i18n-react";
import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../utils/constants";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";

export const REQUEST_SPONSOR_FORMS = "REQUEST_SPONSOR_FORMS";
export const RECEIVE_SPONSOR_FORMS = "RECEIVE_SPONSOR_FORMS";
export const SPONSOR_FORM_ARCHIVED = "SPONSOR_FORM_ARCHIVED";
export const SPONSOR_FORM_UNARCHIVED = "SPONSOR_FORM_UNARCHIVED";
export const REQUEST_GLOBAL_TEMPLATES = "REQUEST_GLOBAL_TEMPLATES";
export const RECEIVE_GLOBAL_TEMPLATES = "RECEIVE_GLOBAL_TEMPLATES";
export const RECEIVE_GLOBAL_SPONSORSHIPS = "RECEIVE_GLOBAL_SPONSORSHIPS";
export const GLOBAL_TEMPLATE_CLONED = "GLOBAL_TEMPLATE_CLONED";
export const TEMPLATE_FORM_CREATED = "TEMPLATE_FORM_CREATED";

export const getSponsorForms =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    hideArchived = false
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    const accessToken = await getAccessTokenSafely();
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm},code=@${escapedTerm}`);
    }

    const params = {
      page,
      fields: "id,code,name,level,expire_date,is_archived",
      relations: "items",
      per_page: perPage,
      access_token: accessToken
    };

    if (hideArchived) filter.push("is_archived==0");

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.ordering = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_SPONSOR_FORMS),
      createAction(RECEIVE_SPONSOR_FORMS),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/show-forms`,
      authErrorHandler,
      { order, orderDir, page, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const archiveSponsorForm = (formId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  return putRequest(
    null,
    createAction(SPONSOR_FORM_ARCHIVED),
    `${window.PURCHASES_API_URL}/api/v1/form-templates/${formId}/archive`,
    null,
    authErrorHandler
  )(params)(dispatch);
};

export const unarchiveSponsorForm = (formId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(SPONSOR_FORM_UNARCHIVED)({ formId }),
    `${window.PURCHASES_API_URL}/api/v1/form-templates/${formId}/archive`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const getGlobalTemplates =
  (
    term = null,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    hideArchived = false
  ) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm},code=@${escapedTerm}`);
    }

    const params = {
      page,
      fields: "id,code,name,level,expire_date,is_archived",
      relations: "items",
      per_page: perPage,
      access_token: accessToken
    };

    if (hideArchived) filter.push("is_archived==0");

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.ordering = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_GLOBAL_TEMPLATES),
      createAction(RECEIVE_GLOBAL_TEMPLATES),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates`,
      authErrorHandler,
      { order, orderDir, page, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getSponsorships =
  (page = 1, perPage = DEFAULT_PER_PAGE) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      sorting: "order",
      expand: "type",
      relations: "type",
      fields: "id,type.id,type.name"
    };

    return getRequest(
      null,
      createAction(RECEIVE_GLOBAL_SPONSORSHIPS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/sponsorships-types`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const cloneGlobalTemplate =
  (templateIds, sponsorIds, allSponsors) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    const normalizedEntity = {
      form_template_ids: templateIds,
      sponsorship_types: sponsorIds,
      apply_to_all_types: allSponsors
    };

    if (allSponsors) {
      delete normalizedEntity.sponsorship_types;
    }

    return postRequest(
      null,
      createAction(GLOBAL_TEMPLATE_CLONED),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/show-forms/clone`,
      normalizedEntity,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(getSponsorForms());
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("sponsor_forms.global_template_popup.success")
          })
        );
      })
      .catch(() => {}); // need to catch promise reject
  };

export const saveTemplateForm = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return postRequest(
    null,
    createAction(TEMPLATE_FORM_CREATED),
    `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/show-forms/clone`,
    entity,
    snackbarErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(getSponsorForms());
  });
};
