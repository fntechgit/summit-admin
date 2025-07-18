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
  getRequest,
  createAction,
  authErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import { CODE_200 } from "../utils/constants";

export const REQUEST_TIMEZONES = "REQUEST_TIMEZONES";
export const RECEIVE_TIMEZONES = "RECEIVE_TIMEZONES";
export const SET_SNACKBAR_MESSAGE = "SET_SNACKBAR_MESSAGE";
export const CLEAR_SNACKBAR_MESSAGE = "CLEAR_SNACKBAR_MESSAGE";

export const getTimezones = () => (dispatch, getState) => {
  const { baseState } = getState();
  if (baseState.timezones.length > 0) return;

  return getRequest(
    createAction(REQUEST_TIMEZONES),
    createAction(RECEIVE_TIMEZONES),
    `${window.API_BASE_URL}/api/public/v1/timezones`,
    authErrorHandler
  )({})(dispatch);
};

export const clearSnackbarMessage = () => (dispatch) => {
  dispatch(createAction(CLEAR_SNACKBAR_MESSAGE)({}));
};

export const setSnackbarMessage = (message) => (dispatch) => {
  dispatch(createAction(SET_SNACKBAR_MESSAGE)(message));
};

export const snackbarErrorHandler = (err, res) => (dispatch, state) =>
  authErrorHandler(err, res, setSnackbarMessage)(dispatch, state);

export const snackbarSuccessHandler = (message) => (dispatch, state) =>
  setSnackbarMessage({ ...message, type: "success", code: CODE_200 })(
    dispatch,
    state
  );
