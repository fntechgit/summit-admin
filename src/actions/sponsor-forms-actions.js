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
import moment from "moment-timezone";
import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  ERROR_CODE_412
} from "../utils/constants";

export const REQUEST_SPONSOR_FORMS = "REQUEST_SPONSOR_FORMS";
export const RECEIVE_SPONSOR_FORMS = "RECEIVE_SPONSOR_FORMS";
export const SPONSOR_FORM_ARCHIVED = "SPONSOR_FORM_ARCHIVED";
export const SPONSOR_FORM_UNARCHIVED = "SPONSOR_FORM_UNARCHIVED";
export const REQUEST_GLOBAL_TEMPLATES = "REQUEST_GLOBAL_TEMPLATES";
export const RECEIVE_GLOBAL_TEMPLATES = "RECEIVE_GLOBAL_TEMPLATES";
export const RECEIVE_GLOBAL_SPONSORSHIPS = "RECEIVE_GLOBAL_SPONSORSHIPS";
export const GLOBAL_TEMPLATE_CLONED = "GLOBAL_TEMPLATE_CLONED";
export const TEMPLATE_FORM_CREATED = "TEMPLATE_FORM_CREATED";
export const ADDITIONAL_FIELD_DELETED = "ADDITIONAL_FIELD_DELETED";
export const ADDITIONAL_FIELD_VALUE_DELETED = "ADDITIONAL_FIELD_VALUE_DELETED";

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
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      sorting: "order"
    };

    return getRequest(
      null,
      createAction(RECEIVE_GLOBAL_SPONSORSHIPS),
      `${window.API_BASE_URL}/api/v1/sponsorship-types`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const cloneGlobalTemplate =
  (tempateIds, sponsorIds, allSponsors) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    const normalizedEntity = {
      form_template_ids: tempateIds,
      sponsorship_type_ids: sponsorIds,
      apply_to_all_types: allSponsors
    };

    return postRequest(
      null,
      createAction(GLOBAL_TEMPLATE_CLONED),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/show-forms/clone`,
      normalizedEntity,
      customErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(getSponsorForms());
    });
  };

const customErrorHandler = (err, res) => (dispatch, state) => {
  const code = err.status;
  dispatch(stopLoading());

  switch (code) {
    case ERROR_CODE_412:
      // dont do anything, caller will catch
      break;
    default:
      authErrorHandler(err, res)(dispatch, state);
  }
};

export const saveFormTemplate = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const normalizedEntity = normalizeFormTemplate(
    entity,
    currentSummit.time_zone_id
  );

  return postRequest(
    null,
    createAction(TEMPLATE_FORM_CREATED),
    `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/show-forms`,
    normalizedEntity,
    customErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(getSponsorForms());
  });
};

const normalizeFormTemplate = (entity, summitTZ) => {
  const normalizedEntity = { ...entity };
  const { opens_at, expires_at } = entity;

  normalizedEntity.opens_at = moment.tz(opens_at, summitTZ).unix();
  normalizedEntity.expires_at = moment.tz(expires_at, summitTZ).unix();

  return normalizedEntity;
};

export const deleteFormTemplateAddtlField =
  (formId, metaFieldId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ADDITIONAL_FIELD_DELETED)({ formId, metaFieldId }),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/show-forms/${formId}/items/${metaFieldId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteFormTemplateAddtlFieldValue =
  (formId, metaFieldId, valueId) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ADDITIONAL_FIELD_VALUE_DELETED)({ formId, metaFieldId, valueId }),
      `${window.PURCHASES_API_URL}/api/v1/summits/${currentSummit.id}/show-forms/${formId}/items/${metaFieldId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
