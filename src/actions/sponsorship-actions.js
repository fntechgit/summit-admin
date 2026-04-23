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

import T from "i18n-react/dist/i18n-react";
import debounce from "lodash/debounce";
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  escapeFilterValue,
  fetchResponseHandler,
  fetchErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import URI from "urijs";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";
import { getAccessTokenSafely } from "../utils/methods";
import {
  DEBOUNCE_WAIT,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE
} from "../utils/constants";

URI.escapeQuerySpace = false;

export const REQUEST_SPONSORSHIPS = "REQUEST_SPONSORSHIPS";
export const RECEIVE_SPONSORSHIPS = "RECEIVE_SPONSORSHIPS";
export const RECEIVE_SPONSORSHIP = "RECEIVE_SPONSORSHIP";
export const RESET_SPONSORSHIP_FORM = "RESET_SPONSORSHIP_FORM";
export const UPDATE_SPONSORSHIP = "UPDATE_SPONSORSHIP";
export const SPONSORSHIP_UPDATED = "SPONSORSHIP_UPDATED";
export const SPONSORSHIP_ADDED = "SPONSORSHIP_ADDED";
export const SPONSORSHIP_DELETED = "SPONSORSHIP_DELETED";

/* *****************  SPONSORS *************************************** */

export const getSponsorships =
  (
    term = "",
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "name",
    orderDir = 1
  ) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const filter = [];

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
    };

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `name=@${escapedTerm},label=@${escapedTerm},size=@${escapedTerm}`
      );
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_SPONSORSHIPS),
      createAction(RECEIVE_SPONSORSHIPS),
      `${window.API_BASE_URL}/api/v1/sponsorship-types`,
      snackbarErrorHandler,
      { order, orderDir, page, perPage }
    )(params)(dispatch).finally(() => {
      dispatch(stopLoading());
    });
  };

export const getSponsorship = (sponsorshipId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_SPONSORSHIP),
    `${window.API_BASE_URL}/api/v1/sponsorship-types/${sponsorshipId}`,
    snackbarErrorHandler
  )(params)(dispatch).finally(() => {
    dispatch(stopLoading());
  });
};

export const resetSponsorshipForm = () => (dispatch) => {
  dispatch(createAction(RESET_SPONSORSHIP_FORM)({}));
};

export const saveSponsorship = (entity) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeSponsorship(entity);

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_SPONSORSHIP),
      createAction(SPONSORSHIP_UPDATED),
      `${window.API_BASE_URL}/api/v1/sponsorship-types/${entity.id}`,
      normalizedEntity,
      snackbarErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("edit_sponsorship.sponsorship_saved")
          })
        );
      })
      .finally(() => dispatch(stopLoading()));
  }

  return postRequest(
    createAction(UPDATE_SPONSORSHIP),
    createAction(SPONSORSHIP_ADDED),
    `${window.API_BASE_URL}/api/v1/sponsorship-types`,
    normalizedEntity,
    snackbarErrorHandler,
    entity
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("edit_sponsorship.sponsorship_created")
        })
      );
    })
    .finally(() => dispatch(stopLoading()));
};

export const deleteSponsorship = (sponsorshipId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(SPONSORSHIP_DELETED)({ sponsorshipId }),
    `${window.API_BASE_URL}/api/v1/sponsorship-types/${sponsorshipId}`,
    null,
    snackbarErrorHandler
  )(params)(dispatch).finally(() => {
    dispatch(stopLoading());
  });
};

const normalizeSponsorship = (entity) => {
  const normalizedEntity = { ...entity };

  return normalizedEntity;
};

export const querySponsorships = debounce(async (input, callback) => {
  const accessToken = await getAccessTokenSafely();
  const endpoint = URI(`${window.API_BASE_URL}/api/v1/sponsorship-types`);
  input = escapeFilterValue(input);
  endpoint.addQuery("access_token", accessToken);
  if (input) {
    endpoint.addQuery("filter", `name=@${input}`);
  }
  fetch(endpoint)
    .then(fetchResponseHandler)
    .then((json) => {
      const options = [...json.data];
      callback(options);
    })
    .catch(fetchErrorHandler);
}, DEBOUNCE_WAIT);

export const querySponsorshipsBySummit = debounce(
  async (input, summitId, callback) => {
    const accessToken = await getAccessTokenSafely();
    const endpoint = URI(
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/sponsorships-types`
    );
    input = escapeFilterValue(input);
    endpoint.addQuery("access_token", accessToken);
    endpoint.addQuery("page", 1);
    endpoint.addQuery("per_page", MAX_PER_PAGE);
    endpoint.addQuery("expand", "type");
    endpoint.addQuery("order", "+name");
    if (input) {
      endpoint.addQuery("filter", `name=@${input}`);
    }
    fetch(endpoint)
      .then(fetchResponseHandler)
      .then((json) => {
        const options = [...json.data];
        callback(options);
      })
      .catch(fetchErrorHandler);
  },
  DEBOUNCE_WAIT
);
