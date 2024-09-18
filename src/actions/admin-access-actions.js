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
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  showMessage,
  showSuccessMessage,
  authErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import history from "../history";
import { getAccessTokenSafely } from "../utils/methods";
import { DEFAULT_PER_PAGE } from "../utils/constants";

export const REQUEST_ADMIN_ACCESSES = "REQUEST_ADMIN_ACCESSES";
export const RECEIVE_ADMIN_ACCESSES = "RECEIVE_ADMIN_ACCESSES";
export const RECEIVE_ADMIN_ACCESS = "RECEIVE_ADMIN_ACCESS";
export const RESET_ADMIN_ACCESS_FORM = "RESET_ADMIN_ACCESS_FORM";
export const UPDATE_ADMIN_ACCESS = "UPDATE_ADMIN_ACCESS";
export const ADMIN_ACCESS_UPDATED = "ADMIN_ACCESS_UPDATED";
export const ADMIN_ACCESS_ADDED = "ADMIN_ACCESS_ADDED";
export const ADMIN_ACCESS_DELETED = "ADMIN_ACCESS_DELETED";

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  delete normalizedEntity.id;
  delete normalizedEntity.created;
  delete normalizedEntity.modified;

  normalizedEntity.members = entity.members.map((m) => m.id);
  normalizedEntity.summits = entity.summits.map((s) => s.id);

  return normalizedEntity;
};

export const getAdminAccesses =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1
  ) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const filter = [];

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      expand: "members,summits",
      relations: "summits.none, members.none",
      fields: "summits.name, members.first_name, members.last_name",
      access_token: accessToken
    };

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `title=@${escapedTerm},member_email=@${escapedTerm},member_full_name=@${escapedTerm}`
      );
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
      createAction(REQUEST_ADMIN_ACCESSES),
      createAction(RECEIVE_ADMIN_ACCESSES),
      `${window.API_BASE_URL}/api/v1/summit-administrator-groups`,
      authErrorHandler,
      { order, orderDir, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getAdminAccess = (adminAccessId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "members,summits",
    relations: "summits.none, members.none",
    fields:
      "summits.name, summits.id, members.first_name, members.last_name, members.email, members.id"
  };

  return getRequest(
    null,
    createAction(RECEIVE_ADMIN_ACCESS),
    `${window.API_BASE_URL}/api/v1/summit-administrator-groups/${adminAccessId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetAdminAccessForm = () => (dispatch) => {
  dispatch(createAction(RESET_ADMIN_ACCESS_FORM)({}));
};

export const saveAdminAccess =
  (entity, noAlert = false) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const normalizedEntity = normalizeEntity(entity);
    const params = { access_token: accessToken };

    if (entity.id) {
      putRequest(
        createAction(UPDATE_ADMIN_ACCESS),
        createAction(ADMIN_ACCESS_UPDATED),
        `${window.API_BASE_URL}/api/v1/summit-administrator-groups/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        if (!noAlert)
          dispatch(showSuccessMessage(T.translate("admin_access.saved")));
        else dispatch(stopLoading());
      });
    } else {
      const successMessage = {
        title: T.translate("general.done"),
        html: T.translate("admin_access.created"),
        type: "success"
      };

      postRequest(
        createAction(UPDATE_ADMIN_ACCESS),
        createAction(ADMIN_ACCESS_ADDED),
        `${window.API_BASE_URL}/api/v1/summit-administrator-groups`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then((payload) => {
        dispatch(
          showMessage(successMessage, () => {
            history.push(`/app/admin-access/${payload.response.id}`);
          })
        );
      });
    }
  };

export const deleteAdminAccess = (adminAccessId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(ADMIN_ACCESS_DELETED)({ adminAccessId }),
    `${window.API_BASE_URL}/api/v1/summit-administrator-groups/${adminAccessId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};
