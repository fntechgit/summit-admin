/**
 * Copyright 2024 OpenStack Foundation
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
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  authErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../utils/constants";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";

export const ADD_PAGE_TEMPLATE = "ADD_PAGE_TEMPLATE";
export const PAGE_TEMPLATE_ADDED = "PAGE_TEMPLATE_ADDED";
export const PAGE_TEMPLATE_DELETED = "PAGE_TEMPLATE_DELETED";
export const PAGE_TEMPLATE_UPDATED = "PAGE_TEMPLATE_UPDATED";
export const RECEIVE_PAGE_TEMPLATE = "RECEIVE_PAGE_TEMPLATE";
export const RECEIVE_PAGE_TEMPLATES = "RECEIVE_PAGE_TEMPLATES";
export const REQUEST_PAGE_TEMPLATES = "REQUEST_PAGE_TEMPLATES";
export const RESET_PAGE_TEMPLATE_FORM = "RESET_PAGE_TEMPLATE_FORM";
export const UPDATE_PAGE_TEMPLATE = "UPDATE_PAGE_TEMPLATE";
export const PAGE_TEMPLATE_ARCHIVED = "PAGE_TEMPLATE_ARCHIVED";
export const PAGE_TEMPLATE_UNARCHIVED = "PAGE_TEMPLATE_UNARCHIVED";

export const getPageTemplates =
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
      expand: "modules",
      fields:
        "id,code,name,modules,is_archived,modules.kind,modules.id,modules.content",
      relations: "modules,modules.none",
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
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_PAGE_TEMPLATES),
      createAction(RECEIVE_PAGE_TEMPLATES),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/page-templates`,
      authErrorHandler,
      { order, orderDir, page, perPage, term, hideArchived }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getPageTemplate = (formTemplateId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "materials,meta_fields,meta_fields.values"
  };

  return getRequest(
    null,
    createAction(RECEIVE_PAGE_TEMPLATE),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/page-templates/${formTemplateId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const deletePageTemplate = (formTemplateId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(PAGE_TEMPLATE_DELETED)({ formTemplateId }),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/page-templates/${formTemplateId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetPageTemplateForm = () => (dispatch) => {
  dispatch(createAction(RESET_PAGE_TEMPLATE_FORM)({}));
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  normalizedEntity.modules = [];

  return normalizedEntity;
};

export const savePageTemplate = (entity) => async (dispatch, getState) => {
  const accessToken = await getAccessTokenSafely();
  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_PAGE_TEMPLATE),
      createAction(PAGE_TEMPLATE_UPDATED),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/page-templates/${entity.id}`,
      normalizedEntity,
      snackbarErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("page_template_list.page_crud.page_saved")
          })
        );
        getPageTemplates()(dispatch, getState);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  }

  return postRequest(
    createAction(ADD_PAGE_TEMPLATE),
    createAction(PAGE_TEMPLATE_ADDED),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/page-templates`,
    normalizedEntity,
    snackbarErrorHandler,
    entity
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("page_template_list.page_crud.page_created")
        })
      );
      getPageTemplates()(dispatch, getState);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};

/* **************************************  ARCHIVE  ************************************** */

export const archivePageTemplate = (pageTemplateId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  return putRequest(
    null,
    createAction(PAGE_TEMPLATE_ARCHIVED),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/page-templates/${pageTemplateId}/archive`,
    null,
    snackbarErrorHandler
  )(params)(dispatch);
};

export const unarchivePageTemplate = (pageTemplateId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(PAGE_TEMPLATE_UNARCHIVED)({ pageTemplateId }),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/page-templates/${pageTemplateId}/archive`,
    null,
    snackbarErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};
