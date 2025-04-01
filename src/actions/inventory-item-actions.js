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
import {
  saveMetaFieldTypes,
  deleteMetaFieldType,
  saveMetaFieldValues,
  deleteMetaFieldTypeValue,
  saveFiles,
  deleteFile
} from "./inventory-shared-actions";
import { amountToCents } from "../utils/currency";

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
export const ADD_INVENTORY_ITEM_IMAGE = "ADD_INVENTORY_ITEM_IMAGE";
export const ADD_INVENTORY_ITEM_META_FIELD_TYPE =
  "ADD_INVENTORY_ITEM_META_FIELD_TYPE";
export const INVENTORY_ITEM_META_FIELD_SAVED =
  "INVENTORY_ITEM_META_FIELD_SAVED";
export const INVENTORY_ITEM_META_FIELD_DELETED =
  "INVENTORY_ITEM_META_FIELD_DELETED";
export const INVENTORY_ITEM_META_FIELD_VALUE_SAVED =
  "INVENTORY_ITEM_META_FIELD_VALUE_SAVED";
export const INVENTORY_ITEM_META_FIELD_VALUE_DELETED =
  "INVENTORY_ITEM_META_FIELD_VALUE_DELETED";
export const INVENTORY_ITEM_IMAGE_SAVED = "INVENTORY_ITEM_IMAGE_SAVED";
export const INVENTORY_ITEM_IMAGE_DELETED = "INVENTORY_ITEM_IMAGE_DELETED";

export const SELECT_INVENTORY_ITEM = "SELECT_INVENTORY_ITEM";
export const UNSELECT_INVENTORY_ITEM = "UNSELECT_INVENTORY_ITEM";
export const CLEAR_ALL_SELECTED_INVENTORY_ITEMS =
  "CLEAR_ALL_SELECTED_INVENTORY_ITEMS";
export const SET_SELECTED_ALL_INVENTORY_ITEMS =
  "SET_SELECTED_ALL_INVENTORY_ITEMS";

export const selectInventoryItem = (inventoryItemId) => (dispatch) => {
  dispatch(createAction(SELECT_INVENTORY_ITEM)(inventoryItemId));
};

export const unSelectInventoryItem = (inventoryItemId) => (dispatch) => {
  dispatch(createAction(UNSELECT_INVENTORY_ITEM)(inventoryItemId));
};

export const clearAllSelectedInventoryItems = () => (dispatch) => {
  dispatch(createAction(CLEAR_ALL_SELECTED_INVENTORY_ITEMS)());
};

export const setSelectedAll = (value) => (dispatch) => {
  dispatch(createAction(SET_SELECTED_ALL_INVENTORY_ITEMS)(value));
};

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
      filter.push(`name=@${escapedTerm},code=@${escapedTerm}`);
    }

    const params = {
      page,
      fields: "id,code,name,images,images.file_url",
      expand: "images",
      per_page: perPage,
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.ordering = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_INVENTORY_ITEMS),
      createAction(RECEIVE_INVENTORY_ITEMS),
      `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items`,
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
    `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItemId}`,
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
    `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItemId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetInventoryItemForm = () => (dispatch) => {
  dispatch(createAction(RESET_INVENTORY_ITEM_FORM)({}));
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };
  normalizedEntity.meta_fields = normalizedEntity.meta_fields?.filter(
    (mf) => mf.name
  );
  normalizedEntity.images = normalizedEntity.images?.filter(
    (img) => img.file_path
  );

  normalizedEntity.early_bird_rate = amountToCents(
    normalizedEntity.early_bird_rate
  );
  normalizedEntity.standard_rate = amountToCents(
    normalizedEntity.standard_rate
  );
  normalizedEntity.onsite_rate = amountToCents(normalizedEntity.onsite_rate);

  return normalizedEntity;
};

export const saveInventoryItem = (entity) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = {
    access_token: accessToken,
    expand: "images,meta_fields,meta_fields.values"
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_INVENTORY_ITEM),
      createAction(INVENTORY_ITEM_UPDATED),
      `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        const promises = [];

        if (entity.images.length > 0) {
          promises.push(saveItemImages(normalizedEntity)(dispatch));
        }

        if (entity.meta_fields.length > 0) {
          promises.push(saveItemMetaFieldTypes(normalizedEntity)(dispatch));
        }

        Promise.all(promises)
          .then(() => {
            dispatch(
              showSuccessMessage(
                T.translate("edit_inventory_item.inventory_item_saved")
              )
            );
          })
          .catch((err) => {
            console.error(err);
          })
          .finally(() => {
            dispatch(stopLoading());
          });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  const success_message = {
    title: T.translate("general.done"),
    html: T.translate("edit_inventory_item.inventory_item_created"),
    type: "success"
  };

  return postRequest(
    createAction(ADD_INVENTORY_ITEM),
    createAction(INVENTORY_ITEM_ADDED),
    `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch)
    .then(({ response }) => {
      const inventoryItem = { ...normalizedEntity, id: response.id };
      const promises = [];

      if (entity.images.length > 0) {
        promises.push(saveItemImages(inventoryItem)(dispatch));
      }

      if (entity.meta_fields.length > 0) {
        promises.push(saveItemMetaFieldTypes(inventoryItem)(dispatch));
      }

      Promise.all(promises)
        .then(() => {
          dispatch(
            showMessage(success_message, () => {
              history.push("/app/inventory");
            })
          );
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          dispatch(stopLoading());
        });
    })
    .catch((err) => {
      console.error(err);
    });
};

/* ************************************  META FIELD TYPES  ************************************ */

const saveItemMetaFieldTypes = (entity) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${entity.id}/meta-field-types`,
    addedActionName: INVENTORY_ITEM_META_FIELD_SAVED,
    updatedActionName: INVENTORY_ITEM_META_FIELD_SAVED
  };
  return saveMetaFieldTypes(
    entity,
    settings,
    (inventoryItemId, metaFieldType) =>
      saveItemMetaFieldValues(inventoryItemId, metaFieldType)
  );
};

export const deleteInventoryItemMetaFieldType = (
  inventoryItemId,
  metaFieldId
) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItemId}/meta-field-types`,
    deletedActionName: INVENTORY_ITEM_META_FIELD_DELETED
  };
  return deleteMetaFieldType(metaFieldId, settings);
};

/* ************************************  META FIELD VALUES  ************************************ */

const saveItemMetaFieldValues = (inventoryItemId, metaFieldType) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItemId}/meta-field-types/${metaFieldType.id}/values`,
    addedActionName: INVENTORY_ITEM_META_FIELD_VALUE_SAVED,
    updatedActionName: INVENTORY_ITEM_META_FIELD_VALUE_SAVED
  };
  return saveMetaFieldValues(metaFieldType, settings);
};

export const deleteInventoryItemMetaFieldTypeValue = (
  inventoryItemId,
  metaFieldId,
  valueId
) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItemId}/meta-field-types/${metaFieldId}/values`,
    deletedActionName: INVENTORY_ITEM_META_FIELD_VALUE_DELETED
  };
  return deleteMetaFieldTypeValue(metaFieldId, valueId, settings);
};

/* **************************************  IMAGES  ************************************** */

const saveItemImages = (inventoryItem) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItem.id}/images`,
    addedActionName: INVENTORY_ITEM_IMAGE_SAVED,
    updatedActionName: INVENTORY_ITEM_IMAGE_SAVED
  };
  return saveFiles(inventoryItem.images, settings);
};

export const deleteInventoryItemImage = (inventoryItemId, imageId) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/inventory-items/${inventoryItemId}/images`,
    deletedActionName: INVENTORY_ITEM_IMAGE_DELETED
  };
  return deleteFile(imageId, settings);
};
