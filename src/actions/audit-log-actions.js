/**
 * Copyright 2022 OpenStack Foundation
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
  getRequest,
  createAction,
  stopLoading,
  startLoading,
  authErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  getAccessTokenSafely,
  isNumericString,
  parseDateRangeFilter
} from "../utils/methods";
import { DEFAULT_CURRENT_PAGE, DEFAULT_ORDER_DIR } from "../utils/constants";

export const CLEAR_LOG_PARAMS = "CLEAR_LOG_PARAMS";
export const REQUEST_LOG = "REQUEST_LOG";
export const RECEIVE_LOG = "RECEIVE_LOG";

const DEFAULT_PER_PAGE_AUDIT_LOG = 100;

const parseFilters = (filters, term = null) => {
  const filter = [];

  if (filters.created_date_filter) {
    parseDateRangeFilter(filter, filters.created_date_filter, "created");
  }

  if (
    filters.hasOwnProperty("user_id_filter") &&
    Array.isArray(filters.user_id_filter) &&
    filters.user_id_filter.length > 0
  ) {
    filter.push(
      `user_id==${filters.user_id_filter.map((t) => t.id).join("||")}`
    );
  }

  if (term) {
    const escapedTerm = escapeFilterValue(term);
    let searchString = "";

    if (isNumericString(term)) {
      searchString += `entity_id==${term}`;
    } else {
      searchString += `action=@${escapedTerm}`;
    }

    filter.push(searchString);
  }

  return filter;
};

export const getAuditLog =
  (
    entityFilter = [],
    term = null,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE_AUDIT_LOG,
    order = null,
    orderDir = DEFAULT_ORDER_DIR,
    filters = {}
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const summitTZ = currentSummit.time_zone_id;
    const summitFilter = [`summit_id==${currentSummit.id}`];

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      expand: "user",
      access_token: accessToken
    };

    const parsedFilters = [
      ...summitFilter,
      ...entityFilter,
      ...parseFilters(filters, term)
    ];

    params["filter[]"] = parsedFilters;

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_LOG),
      createAction(RECEIVE_LOG),
      `${window.API_BASE_URL}/api/v1/audit-logs`,
      authErrorHandler,
      { page, perPage, order, orderDir, term, summitTZ, filters }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const clearAuditLogParams = () => async (dispatch) => {
  dispatch(createAction(CLEAR_LOG_PARAMS)());
};
