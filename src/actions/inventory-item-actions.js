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
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../utils/constants";

export const ADD_INVENTORY_ITEM = "ADD_INVENTORY_ITEM";
export const CHANGE_INVENTORY_ITEM_SEARCH_TERM =
  "CHANGE_INVENTORY_ITEM_SEARCH_TERM";
export const INVENTORY_ITEM_ADDED = "INVENTORY_ITEM_ADDED";
export const INVENTORY_ITEM_DELETED = "INVENTORY_ITEM_DELETED";
export const INVENTORY_ITEM_UPDATED = "INVENTORY_ITEM_UPDATED";
export const RECEIVE_INVENTORY_ITEM = "RECEIVE_INVENTORY_ITEM";
export const RECEIVE_INVENTORY_ITEMS = "RECEIVE_INVENTORY_ITEMS";
export const REQUEST_INVENTORY_ITEMS = "REQUEST_INVENTORY_ITEMS";
export const RESET_INVENTORY_ITEM_FORM = "RESET_INVENTORY_ITEM_FORM";
export const UPDATE_INVENTORY_ITEM = "UPDATE_INVENTORY_ITEM";

export const getInventoryItems =
  (
    term = null,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm}`);
    }

    const params = {
      page,
      fields: "id,code,name",
      per_page: perPage,
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_INVENTORY_ITEMS),
      createAction(RECEIVE_INVENTORY_ITEMS),
      `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/`,
      authErrorHandler,
      { order, orderDir, page, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getInventoryItem = (inventoryItemId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "images,meta_fields,meta_fields.values"
  };

  return getRequest(
    null,
    createAction(RECEIVE_INVENTORY_ITEM),
    `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItemId}/`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const deleteInventoryItem = (inventoryItemId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(INVENTORY_ITEM_DELETED)({ inventoryItemId }),
    `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItemId}/`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetInventoryItemForm = () => (dispatch) => {
  dispatch(createAction(RESET_INVENTORY_ITEM_FORM)({}));
};

export const saveInventoryItem = (entity) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const normalizedEntity = normalizeEntity(entity);

  if (entity.id) {
    putRequest(
      createAction(UPDATE_INVENTORY_ITEM),
      createAction(INVENTORY_ITEM_UPDATED),
      `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${entity.id}/`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(
          T.translate("edit_inventory_item.inventory_item_saved")
        )
      );
    });
  } else {
    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_inventory_item.inventory_item_created"),
      type: "success"
    };

    postRequest(
      createAction(ADD_INVENTORY_ITEM),
      createAction(INVENTORY_ITEM_ADDED),
      `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showMessage(success_message, () => {
          history.push("/app/sponsors-inventory");
        })
      );
    });
  }
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  return normalizedEntity;
};
