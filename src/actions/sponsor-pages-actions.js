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

export const REQUEST_SPONSOR_PAGES = "REQUEST_SPONSOR_PAGES";
export const RECEIVE_SPONSOR_PAGES = "RECEIVE_SPONSOR_PAGES";

export const RECEIVE_SPONSOR_PAGE = "RECEIVE_SPONSOR_PAGE";
export const SPONSOR_PAGE_UPDATED = "SPONSOR_PAGE_UPDATED";
export const SPONSOR_PAGE_ADDED = "SPONSOR_PAGE_ADDED";
export const SPONSOR_PAGE_ARCHIVED = "SPONSOR_PAGE_ARCHIVED";
export const SPONSOR_PAGE_UNARCHIVED = "SPONSOR_PAGE_UNARCHIVED";
export const RESET_SPONSOR_PAGE_FORM = "RESET_SPONSOR_PAGE_FORM";

export const GLOBAL_PAGE_CLONED = "GLOBAL_PAGE_CLONED";

export const getSponsorPages =
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
      createAction(REQUEST_SPONSOR_PAGES),
      createAction(RECEIVE_SPONSOR_PAGES),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages`,
      authErrorHandler,
      { order, orderDir, page, term, hideArchived }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getSponsorPage = (pageId) => async (dispatch, getState) => {
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
    createAction(RECEIVE_SPONSOR_PAGE),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${pageId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

const normalizeSponsorPage = (entity) => {
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

export const saveSponsorPage = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const normalizedSponsorPage = normalizeSponsorPage(entity);

  if (entity.id) {
    return putRequest(
      null,
      createAction(SPONSOR_PAGE_UPDATED),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${entity.id}`,
      normalizedSponsorPage,
      snackbarErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("sponsor_pages.page_saved")
          })
        );
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  }

  return postRequest(
    null,
    createAction(SPONSOR_PAGE_ADDED),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages`,
    normalizedSponsorPage,
    snackbarErrorHandler,
    entity
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_pages.page_created")
        })
      );
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const resetSponsorPageForm = () => (dispatch) => {
  dispatch(createAction(RESET_SPONSOR_PAGE_FORM)({}));
};

export const cloneGlobalPage =
  (pagesIds, sponsorIds, allSponsors) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    const normalizedEntity = {
      page_template_ids: pagesIds,
      sponsorship_types: sponsorIds,
      apply_to_all_types: allSponsors
    };

    if (allSponsors) {
      delete normalizedEntity.sponsorship_types;
    }

    return postRequest(
      null,
      createAction(GLOBAL_PAGE_CLONED),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/clone`,
      normalizedEntity,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(getSponsorPages());
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("sponsor_pages.global_page_popup.success")
          })
        );
      })
      .finally(() => dispatch(stopLoading()));
  };

export const archiveSponsorPage = (pageId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return putRequest(
    null,
    createAction(SPONSOR_PAGE_ARCHIVED)({ pageId }),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${pageId}/archive`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_pages.archived")
        })
      );
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const unarchiveSponsorPage = (pageId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(SPONSOR_PAGE_UNARCHIVED)({ pageId }),
    `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/show-pages/${pageId}/archive`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_pages.unarchived")
        })
      );
    })
    .finally(() => {
      dispatch(stopLoading());
    });
};
