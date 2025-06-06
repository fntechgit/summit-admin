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

import {
  VALIDATE,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  authErrorHandler,
  escapeFilterValue,
  fetchResponseHandler,
  fetchErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import URI from "urijs";
import Swal from "sweetalert2";
import _ from "lodash";

import { getAccessTokenSafely } from "../utils/methods";
import {
  DEBOUNCE_WAIT,
  ERROR_CODE_412,
  FIFTEEN_PER_PAGE
} from "../utils/constants";

export const FILTER_CRITERIA_ADDED = "FILTER_CRITERIA_ADDED";
export const FILTER_CRITERIA_DELETED = "FILTER_CRITERIA_DELETED";

const customErrorHandler = (err, res) => (dispatch) => {
  const code = err.status;
  let msg = "";

  dispatch(stopLoading());

  switch (code) {
    case ERROR_CODE_412:
      if (Array.isArray(err.response.body)) {
        err.response.body.forEach((er) => {
          msg += `${er}<br>`;
        });
      } else {
        Object.keys(err.response.body).forEach((key) => {
          msg += `${err.response.body[key]}<br>`;
        });
      }

      Swal.fire("Validation error", msg, "warning");

      if (err.response.body.errors) {
        dispatch({
          type: VALIDATE,
          payload: { errors: err.response.body }
        });
      }

      break;
    default:
      dispatch(authErrorHandler(err, res));
  }
};

export const saveFilterCriteria = (filterCriteria) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  return postRequest(
    null,
    createAction(FILTER_CRITERIA_ADDED),
    `${window.PERSIST_FILTER_CRITERIA_API}/api/v1/filter-criterias`,
    filterCriteria,
    customErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const deleteFilterCriteria = (filterCriteriaId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(FILTER_CRITERIA_DELETED)({ filterCriteriaId }),
    `${window.PERSIST_FILTER_CRITERIA_API}/api/v1/filter-criterias/${filterCriteriaId}`,
    null,
    customErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const queryFilterCriterias = _.debounce(
  async (summitId, context, input, callback) => {
    const accessToken = await getAccessTokenSafely();

    const apiUrl = URI(
      `${window.PERSIST_FILTER_CRITERIA_API}/api/v1/filter-criterias`
    );
    apiUrl.addQuery("access_token", accessToken);
    apiUrl.addQuery("order", "+name");
    apiUrl.addQuery("order", "+id");
    apiUrl.addQuery("per_page", FIFTEEN_PER_PAGE);
    apiUrl.addQuery("show_id", `${summitId}`);
    apiUrl.addQuery("context", `${context}`);

    input = escapeFilterValue(input);
    apiUrl.addQuery("name__contains", `${input}`);

    fetch(apiUrl.toString())
      .then(fetchResponseHandler)
      .then((json) => {
        const options = [...json.data];
        callback(options);
      })
      .catch(fetchErrorHandler);
  },
  DEBOUNCE_WAIT
);
