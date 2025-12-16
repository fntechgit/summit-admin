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

export const REQUEST_SPONSOR_PAGES = "REQUEST_SPONSOR_PAGES";
export const RECEIVE_SPONSOR_PAGES = "RECEIVE_SPONSOR_PAGES";

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
        dispatch(getSponsorForms());
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("sponsor_pages.global_page_popup.success")
          })
        );
      })
      .catch(() => {}); // need to catch promise reject
  };
