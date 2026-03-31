/*
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
  stopLoading,
  startLoading,
  authErrorHandler,
  fetchResponseHandler,
  fetchErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";
import { DUMMY_ACTION } from "../utils/constants";

export const REQUEST_REPORT = "REQUEST_REPORT";
export const RECEIVE_REPORT = "RECEIVE_REPORT";
export const REQUEST_EXPORT_REPORT = "REQUEST_EXPORT_REPORT";
export const RECEIVE_EXPORT_REPORT = "RECEIVE_EXPORT_REPORT";
export const RESET_EXPORT_REPORT = "RESET_EXPORT_REPORT";
export const LOADING_EXPORT_REPORT = "LOADING_EXPORT_REPORT";

const TIMEOUT = 300; // secs

export const getReport = (query, reportName, page) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    query
  };

  return getRequest(
    createAction(REQUEST_REPORT),
    createAction(RECEIVE_REPORT),
    `${window.REPORT_API_BASE_URL}/reports`,
    authErrorHandler,
    { name: reportName, page },
    TIMEOUT,
    TIMEOUT
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const getMetricRaw = (query) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  return fetch(
    `${
      window.REPORT_API_BASE_URL
    }/reports?access_token=${accessToken}&query=${encodeURIComponent(query)}`
  )
    .then(fetchResponseHandler)
    .then((response) => {
      dispatch(stopLoading());
      return response?.data?.reportData?.results || [];
    })
    .catch(fetchErrorHandler);
};

export const exportReport =
  (buildQuery, reportName, grouped, preProcessData = null) =>
  async (dispatch, getState) => {
    const { currentReportState } = getState();
    const { totalCount } = currentReportState;
    const perPage = 100;
    const accessToken = await getAccessTokenSafely();
    // grouped reports don't use pagination, we pull all the records
    const totalPages = grouped ? 1 : Math.ceil(totalCount / perPage);
    let reportData = [];
    let rawData = [];
    let extraData = null;

    const params = {
      access_token: accessToken,
      query: null
    };

    try {
      for (let i = 1; i <= totalPages; i++) {
        params.query = buildQuery(i, perPage);

        dispatch(
          createAction(LOADING_EXPORT_REPORT)({ exportProgress: i * perPage })
        );

        await getRequest(
          createAction(REQUEST_EXPORT_REPORT),
          createAction(DUMMY_ACTION),
          `${window.REPORT_API_BASE_URL}/reports`,
          authErrorHandler,
          {},
          TIMEOUT,
          TIMEOUT
        )(params)(dispatch)
          // eslint-disable-next-line no-loop-func
          .then(({ response }) => {
            const data = response.data?.reportData || {};
            extraData = response.data?.extraData || null;

            if (data.results) {
              rawData = [...rawData, ...data.results];
            } else {
              rawData = data;
            }
          });
      }

      if (preProcessData) {
        const procData = preProcessData(rawData, extraData, true);
        const labels = procData.tableColumns.map((col) => col.value);
        const keys = procData.tableColumns.map((col) => col.columnKey);

        // replace labels
        if (grouped) {
          for (const groupName in procData.reportData) {
            const newSheet = { name: groupName, data: [] };
            const groupData = procData.reportData[groupName];
            for (const item in groupData) {
              const newData = {};

              for (const a in labels) {
                newData[labels[a]] = groupData[item][keys[a]];
              }
              newSheet.data.push(newData);
            }
            reportData.push(newSheet);
          }
        } else {
          for (const item in procData.reportData) {
            const newData = {};

            for (const a in labels) {
              newData[labels[a]] = procData.reportData[item][keys[a]];
            }
            reportData.push(newData);
          }
          reportData = [{ name: "Data", data: reportData }];
        }
      } else {
        reportData = [{ name: "Data", data: flattenData(rawData) }];
      }
    } catch (error) {
      console.log("ERROR EXPORTING REPORT: ", error);
      dispatch(createAction(RESET_EXPORT_REPORT)({}));
    }

    // dispatch(stopLoading());
    dispatch(createAction(RECEIVE_EXPORT_REPORT)({ reportData }));

    // cleanup, file already created
    dispatch(createAction(RESET_EXPORT_REPORT)({}));
  };

export const flattenData = (data) => {
  const flatData = [];
  const rawData = JSON.parse(JSON.stringify(data));

  for (let idx = 0; idx < rawData.length; idx++) {
    const idxRef = { idx };
    const flatItem = {};
    flattenItem(flatItem, rawData[idx], idxRef);
    idx = idxRef.idx;
    flatData.push(flatItem);
  }

  return flatData;
};

export const flattenItem = (flatData, item, idxRef, ctx = "") => {
  if (typeof item !== "object") {
    flatData[ctx] = item;
  } else {
    for (const property in item) {
      const flatName = ctx ? `${ctx}_${property}` : property;

      if (item[property] == null) {
        flatData[flatName] = "";
      } else if (Array.isArray(item[property]) && item[property].length > 0) {
        flattenItem(flatData, item[property].shift(), idxRef, flatName);
        if (item[property].length > 0 && typeof item[property] !== "string") {
          idxRef.idx--; // redo this item
        }
      } else if (
        typeof item[property] === "object" &&
        typeof item[property] !== "string"
      ) {
        flattenItem(flatData, item[property], idxRef, flatName);
      } else {
        flatData[flatName] = item[property];
      }
    }
  }
};
