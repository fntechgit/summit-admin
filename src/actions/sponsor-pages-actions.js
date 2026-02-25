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
  createAction,
  getRequest,
  postRequest,
  startLoading,
  stopLoading,
  authErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import T from "i18n-react/dist/i18n-react";
import { getAccessTokenSafely } from "../utils/methods";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../utils/constants";

export const GLOBAL_PAGE_CLONED = "GLOBAL_PAGE_CLONED";

export const REQUEST_SPONSOR_MANAGED_PAGES = "REQUEST_SPONSOR_MANAGED_PAGES";
export const RECEIVE_SPONSOR_MANAGED_PAGES = "RECEIVE_SPONSOR_MANAGED_PAGES";
export const SPONSOR_MANAGED_PAGE_ADDED = "SPONSOR_MANAGED_PAGE_ADDED";

export const REQUEST_SPONSOR_CUSTOMIZED_PAGES =
  "REQUEST_SPONSOR_CUSTOMIZED_PAGES";
export const RECEIVE_SPONSOR_CUSTOMIZED_PAGES =
  "RECEIVE_SPONSOR_CUSTOMIZED_PAGES";

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
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("show_pages.global_page_popup.success")
          })
        );
      })
      .finally(() => dispatch(stopLoading()));
  };

/* ************************************************************************ */
/*         MANAGED PAGES       */
/* ************************************************************************ */

export const getSponsorManagedPages =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    hideArchived = false
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: sponsorId }
    } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();
    const summitTZ = currentSummit.time_zone.name;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm},code=@${escapedTerm}`);
    }

    const params = {
      page,
      fields: "id,code,name,kind,modules_count,allowed_add_ons",
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
      createAction(REQUEST_SPONSOR_MANAGED_PAGES),
      createAction(RECEIVE_SPONSOR_MANAGED_PAGES),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsorId}/managed-pages`,
      authErrorHandler,
      { order, orderDir, page, perPage, term, hideArchived, summitTZ }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const saveSponsorManagedPage =
  (entity) => async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: sponsorId }
    } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const normalizedEntity = normalizeSponsorManagedPage(entity);

    const params = {
      access_token: accessToken,
      fields: "id,code,name,kind,modules_count,allowed_add_ons"
    };

    return postRequest(
      null,
      createAction(SPONSOR_MANAGED_PAGE_ADDED),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsorId}/managed-pages`,
      normalizedEntity,
      snackbarErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

const normalizeSponsorManagedPage = (entity) => {
  const normalizedEntity = {
    show_page_ids: entity.pages,
    allowed_add_ons: entity.add_ons.map((a) => a.id),
    apply_to_all_add_ons: false
  };

  if (entity.add_ons.includes("all")) {
    normalizedEntity.apply_to_all_add_ons = true;
    normalizedEntity.allowed_add_ons = [];
  }

  return normalizedEntity;
};
/* ************************************************************************ */
/*         CUSTOMIZED PAGES       */
/* ************************************************************************ */

export const getSponsorCustomizedPages =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    hideArchived = false
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentSponsorState } = getState();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: sponsorId }
    } = currentSponsorState;
    const accessToken = await getAccessTokenSafely();
    const summitTZ = currentSummit.time_zone.name;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm},code=@${escapedTerm}`);
    }

    const params = {
      page,
      fields: "id,code,name,kind,modules_count,allowed_add_ons",
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
      createAction(REQUEST_SPONSOR_CUSTOMIZED_PAGES),
      createAction(RECEIVE_SPONSOR_CUSTOMIZED_PAGES),
      `${window.SPONSOR_PAGES_API_URL}/api/v1/summits/${currentSummit.id}/sponsors/${sponsorId}/sponsor-pages`,
      authErrorHandler,
      { order, orderDir, page, perPage, term, hideArchived, summitTZ }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
