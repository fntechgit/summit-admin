/**
 * Copyright 2026 OpenStack Foundation
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
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import T from "i18n-react/dist/i18n-react";
import moment from "moment-timezone";
import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  PAGES_MODULE_KINDS
} from "../utils/constants";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";

export const REQUEST_SHOW_PAGES = "REQUEST_SHOW_PAGES";
export const RECEIVE_SHOW_PAGES = "RECEIVE_SHOW_PAGES";

export const RECEIVE_SHOW_PAGE = "RECEIVE_SHOW_PAGE";
export const SHOW_PAGE_UPDATED = "SHOW_PAGE_UPDATED";
export const SHOW_PAGE_ADDED = "SHOW_PAGE_ADDED";
export const SHOW_PAGE_ARCHIVED = "SHOW_PAGE_ARCHIVED";
export const SHOW_PAGE_UNARCHIVED = "SHOW_PAGE_UNARCHIVED";
export const RESET_SHOW_PAGE_FORM = "RESET_SHOW_PAGE_FORM";
export const SHOW_PAGE_DELETED = "SHOW_PAGE_DELETED";

export const getShowPages =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    hideArchived = false,
    sponsorshipTypesId = []
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    const summitTZ = currentSummit.time_zone?.name;
    const accessToken = await getAccessTokenSafely();
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm},code=@${escapedTerm}`);
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "sponsorship_types"
    };

    if (hideArchived) filter.push("is_archived==0");

    if (sponsorshipTypesId?.length > 0) {
      const formattedSponsorships = sponsorshipTypesId.join("&&");
      filter.push("applies_to_all_tiers==0");
      filter.push(`sponsorship_type_id_not_in==${formattedSponsorships}`);
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_SHOW_PAGES),
      createAction(RECEIVE_SHOW_PAGES),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages`,
      authErrorHandler,
      { order, orderDir, page, term, hideArchived, summitTZ }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getShowPage = (pageId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "modules,modules.file_type"
  };

  return getRequest(
    null,
    createAction(RECEIVE_SHOW_PAGE),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${pageId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

const normalizeShowPage = (entity) => {
  const normalizedEntity = { ...entity };

  normalizedEntity.modules = entity.modules.map((module) => {
    const normalizedModule = { ...module };

    if (module.kind === PAGES_MODULE_KINDS.MEDIA && module.upload_deadline) {
      normalizedModule.upload_deadline = moment
        .utc(module.upload_deadline)
        .unix();
    }

    if (module.kind === PAGES_MODULE_KINDS.MEDIA && module.file_type_id) {
      normalizedModule.file_type_id =
        module.file_type_id?.value || module.file_type_id;
    }

    if (module.kind === PAGES_MODULE_KINDS.DOCUMENT && module.file) {
      normalizedModule.file = module.file[0] || null;
    }

    delete normalizedModule._tempId;

    return normalizedModule;
  });

  return normalizedEntity;
};

export const saveShowPage = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const normalizedShowPage = normalizeShowPage(entity);

  if (entity.id) {
    return putRequest(
      null,
      createAction(SHOW_PAGE_UPDATED),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${entity.id}`,
      normalizedShowPage,
      snackbarErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("show_pages.page_saved")
          })
        );
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  }

  return postRequest(
    null,
    createAction(SHOW_PAGE_ADDED),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages`,
    normalizedShowPage,
    snackbarErrorHandler,
    entity
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("show_pages.page_created")
        })
      );
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const resetShowPageForm = () => (dispatch) => {
  dispatch(createAction(RESET_SHOW_PAGE_FORM)({}));
};

export const deleteShowPage = (pageId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(SHOW_PAGE_DELETED)({ pageId }),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${pageId}`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("show_pages.page_delete_success")
        })
      );
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const archiveShowPage = (pageId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return putRequest(
    null,
    createAction(SHOW_PAGE_ARCHIVED)({ pageId }),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${pageId}/archive`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("show_pages.archived")
        })
      );
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const unarchiveShowPage = (pageId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(SHOW_PAGE_UNARCHIVED)({ pageId }),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${pageId}/archive`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("show_pages.unarchived")
        })
      );
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};
