/**
 * Copyright 2025 OpenStack Foundation
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
import { amountToCents } from "openstack-uicore-foundation/lib/utils/money";
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
  deleteFile,
  archiveItem,
  unarchiveItem
} from "./inventory-shared-actions";

export const ADD_FORM_TEMPLATE_ITEM = "ADD_FORM_TEMPLATE_ITEM";
export const CHANGE_FORM_TEMPLATE_ITEM_SEARCH_TERM =
  "CHANGE_FORM_TEMPLATE_ITEM_SEARCH_TERM";
export const FORM_TEMPLATE_ITEM_ADDED = "FORM_TEMPLATE_ITEM_ADDED";
export const FORM_TEMPLATE_ITEM_DELETED = "FORM_TEMPLATE_ITEM_DELETED";
export const FORM_TEMPLATE_ITEM_UPDATED = "FORM_TEMPLATE_ITEM_UPDATED";
export const RECEIVE_FORM_TEMPLATE_ITEM = "RECEIVE_FORM_TEMPLATE_ITEM";
export const RECEIVE_FORM_TEMPLATE_ITEMS = "RECEIVE_FORM_TEMPLATE_ITEMS";
export const REQUEST_FORM_TEMPLATE_ITEMS = "REQUEST_FORM_TEMPLATE_ITEMS";
export const RESET_FORM_TEMPLATE_ITEM_FORM = "RESET_FORM_TEMPLATE_ITEM_FORM";
export const UPDATE_FORM_TEMPLATE_ITEM = "UPDATE_FORM_TEMPLATE_ITEM";
export const ADD_FORM_TEMPLATE_ITEM_IMAGE = "ADD_FORM_TEMPLATE_ITEM_IMAGE";
export const ADD_FORM_TEMPLATE_ITEM_META_FIELD_TYPE =
  "ADD_FORM_TEMPLATE_ITEM_META_FIELD_TYPE";
export const FORM_TEMPLATE_ITEM_META_FIELD_SAVED =
  "FORM_TEMPLATE_ITEM_META_FIELD_SAVED";
export const FORM_TEMPLATE_ITEM_META_FIELD_DELETED =
  "FORM_TEMPLATE_ITEM_META_FIELD_DELETED";
export const FORM_TEMPLATE_ITEM_META_FIELD_VALUE_SAVED =
  "FORM_TEMPLATE_ITEM_META_FIELD_VALUE_SAVED";
export const FORM_TEMPLATE_ITEM_META_FIELD_VALUE_DELETED =
  "FORM_TEMPLATE_ITEM_META_FIELD_VALUE_DELETED";
export const FORM_TEMPLATE_ITEM_IMAGE_SAVED = "FORM_TEMPLATE_ITEM_IMAGE_SAVED";
export const FORM_TEMPLATE_ITEM_IMAGE_DELETED =
  "FORM_TEMPLATE_ITEM_IMAGE_DELETED";
export const FORM_TEMPLATE_ITEM_ARCHIVED = "FORM_TEMPLATE_ITEM_ARCHIVED";
export const FORM_TEMPLATE_ITEM_UNARCHIVED = "FORM_TEMPLATE_ITEM_UNARCHIVED";

export const getFormTemplateItems =
  (
    formTemplateId,
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    hideArchived = false
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
      fields: "id,code,name,is_archived,images,images.file_url",
      expand: "images",
      per_page: perPage,
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    if (hideArchived) filter.push("is_archived==0");

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_FORM_TEMPLATE_ITEMS),
      createAction(RECEIVE_FORM_TEMPLATE_ITEMS),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items`,
      authErrorHandler,
      { order, orderDir, page, term, hideArchived }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getFormTemplateItem =
  (formTemplateId, formTemplateItemId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand: "images,meta_fields,meta_fields.values"
    };

    return getRequest(
      null,
      createAction(RECEIVE_FORM_TEMPLATE_ITEM),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItemId}`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteFormTemplateItem =
  (formTemplateId, formTemplateItemId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(FORM_TEMPLATE_ITEM_DELETED)({
        formTemplateId,
        formTemplateItemId
      }),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItemId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const resetFormTemplateItemForm = () => (dispatch) => {
  dispatch(createAction(RESET_FORM_TEMPLATE_ITEM_FORM)({}));
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

export const saveFormTemplateItem =
  (formTemplateId, entity) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const params = {
      access_token: accessToken,
      expand: "images,meta_fields,meta_fields.values"
    };

    dispatch(startLoading());

    const normalizedEntity = normalizeEntity(entity);

    if (entity.id) {
      return putRequest(
        createAction(UPDATE_FORM_TEMPLATE_ITEM),
        createAction(FORM_TEMPLATE_ITEM_UPDATED),
        `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch)
        .then(() => {
          const promises = [];

          if (normalizedEntity.images.length > 0) {
            promises.push(
              saveItemImages(formTemplateId, normalizedEntity)(dispatch)
            );
          }

          if (normalizedEntity.meta_fields.length > 0) {
            promises.push(
              saveItemMetaFieldTypes(formTemplateId, normalizedEntity)(dispatch)
            );
          }

          return Promise.all(promises)
            .then(() => {
              dispatch(
                showSuccessMessage(
                  T.translate(
                    "edit_form_template_item.form_template_item_saved"
                  )
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
      html: T.translate("edit_form_template_item.form_template_item_created"),
      type: "success"
    };

    return postRequest(
      createAction(ADD_FORM_TEMPLATE_ITEM),
      createAction(FORM_TEMPLATE_ITEM_ADDED),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch)
      .then(({ response }) => {
        const formTemplateItem = { ...normalizedEntity, id: response.id };
        const promises = [];

        if (normalizedEntity.images.length > 0) {
          promises.push(
            saveItemImages(formTemplateId, formTemplateItem)(dispatch)
          );
        }

        if (normalizedEntity.meta_fields.length > 0) {
          promises.push(
            saveItemMetaFieldTypes(formTemplateId, formTemplateItem)(dispatch)
          );
        }

        return Promise.all(promises)
          .then(() => {
            dispatch(
              showMessage(success_message, () => {
                history.push("/app/form-templates");
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

export const cloneFromInventoryItem =
  (formTemplateId, inventoryItemId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const params = {
      access_token: accessToken,
      expand: "images,meta_fields,meta_fields.values"
    };

    const payload = {
      inventory_item_id: inventoryItemId
    };

    dispatch(startLoading());

    return postRequest(
      createAction(ADD_FORM_TEMPLATE_ITEM),
      createAction(FORM_TEMPLATE_ITEM_ADDED),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/clone`,
      payload,
      authErrorHandler,
      payload
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/* ************************************  META FIELD TYPES  ************************************ */

const saveItemMetaFieldTypes = (formTemplateId, formTemplateItem) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItem.id}/meta-field-types`,
    addedActionName: FORM_TEMPLATE_ITEM_META_FIELD_SAVED,
    updatedActionName: FORM_TEMPLATE_ITEM_META_FIELD_SAVED
  };
  return saveMetaFieldTypes(
    formTemplateItem,
    settings,
    (formTemplateItemId, metaFieldType) =>
      saveItemMetaFieldValues(formTemplateId, formTemplateItemId, metaFieldType)
  );
};

export const deleteItemMetaFieldType = (
  formTemplateId,
  formTemplateItemId,
  metaFieldId
) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItemId}/meta-field-types`,
    deletedActionName: FORM_TEMPLATE_ITEM_META_FIELD_DELETED
  };
  return deleteMetaFieldType(metaFieldId, settings);
};

/* ************************************  META FIELD VALUES  ************************************ */

const saveItemMetaFieldValues = (
  formTemplateId,
  formTemplateItemId,
  metaFieldType
) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItemId}/meta-field-types/${metaFieldType.id}/values`,
    addedActionName: FORM_TEMPLATE_ITEM_META_FIELD_VALUE_SAVED,
    updatedActionName: FORM_TEMPLATE_ITEM_META_FIELD_VALUE_SAVED
  };
  return saveMetaFieldValues(metaFieldType, settings);
};

export const deleteItemMetaFieldTypeValue = (
  formTemplateId,
  formTemplateItemId,
  metaFieldId,
  valueId
) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItemId}/meta-field-types/${metaFieldId}/values/`,
    deletedActionName: FORM_TEMPLATE_ITEM_META_FIELD_VALUE_DELETED
  };
  return deleteMetaFieldTypeValue(metaFieldId, valueId, settings);
};

/* **************************************  IMAGES  ************************************** */

const saveItemImages = (formTemplateId, formTemplateItem) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItem.id}/images`,
    addedActionName: FORM_TEMPLATE_ITEM_IMAGE_SAVED,
    updatedActionName: FORM_TEMPLATE_ITEM_IMAGE_SAVED
  };
  return saveFiles(formTemplateItem.images, settings);
};

export const deleteItemImage = (
  formTemplateId,
  formTemplateItemId,
  imageId
) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItemId}/images`,
    deletedActionName: FORM_TEMPLATE_ITEM_IMAGE_DELETED
  };
  return deleteFile(imageId, settings);
};

/* **************************************  ARCHIVE  ************************************** */

export const archiveFormTemplateItem = (formTemplateId, formTemplateItem) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItem.id}/archive`,
    updatedActionName: FORM_TEMPLATE_ITEM_ARCHIVED
  };
  return archiveItem(formTemplateItem, settings);
};

export const unarchiveFormTemplateItem = (formTemplateId, formTemplateItem) => {
  const settings = {
    url: `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/items/${formTemplateItem.id}/archive`,
    deletedActionName: FORM_TEMPLATE_ITEM_UNARCHIVED
  };
  return unarchiveItem(formTemplateItem, settings);
};
