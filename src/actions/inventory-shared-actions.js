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

import {
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  authErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";

const validateSettings = (settings) => {
  if (typeof settings !== "object" || settings === null) {
    return { isValid: false, error: "Invalid setting object." };
  }

  if (!settings.url || typeof settings.url !== "string") {
    return { isValid: false, error: "'url' setting is required" };
  }

  return { isValid: true };
};

export const metafieldHasValues = (type) =>
  ["CheckBoxList", "ComboBox", "RadioButtonList"].includes(type);

/* ************************************  META FIELD TYPES  ************************************ */

const normalizeMetaFieldEntity = (entity) => ({
  ...entity,
  is_required: !!entity.is_required
});

export const saveMetaFieldTypes =
  (parent, settings = null, saveMetaFieldValuesCallback = null) =>
  async (dispatch) => {
    const settingsValidation = validateSettings(settings);

    if (!settingsValidation.isValid) {
      console.error(settingsValidation.error);
      return;
    }
    const accessToken = await getAccessTokenSafely();
    const params = {
      access_token: accessToken,
      expand: "values"
    };

    const promises = parent.meta_fields.map((metaFieldType) => {
      const normalizedEntity = normalizeMetaFieldEntity(metaFieldType);

      if (metaFieldType.id) {
        return putRequest(
          null,
          createAction(settings.updatedActionName),
          `${settings.url}${metaFieldType.id}/`,
          normalizedEntity,
          authErrorHandler,
          metaFieldType
        )(params)(dispatch).then(() => {
          if (
            metaFieldType.values.length > 0 &&
            metafieldHasValues(metaFieldType.type) &&
            saveMetaFieldValuesCallback
          ) {
            return saveMetaFieldValuesCallback(
              parent.id,
              metaFieldType
            )(dispatch);
          }
        });
      }
      return postRequest(
        null,
        createAction(settings.addedActionName),
        settings.url,
        normalizedEntity,
        authErrorHandler,
        metaFieldType
      )(params)(dispatch).then(({ response }) => {
        if (
          metaFieldType.values?.length > 0 &&
          metafieldHasValues(metaFieldType.type) &&
          saveMetaFieldValuesCallback
        ) {
          const metaField = { ...metaFieldType, id: response.id };
          return saveMetaFieldValuesCallback(parent.id, metaField)(dispatch);
        }
      });
    });

    return Promise.all(promises).catch((err) => {
      console.error(err);
    });
  };

export const deleteMetaFieldType =
  (metaFieldId, settings = null) =>
  async (dispatch) => {
    const settingsValidation = validateSettings(settings);

    if (!settingsValidation.isValid) {
      console.error(settingsValidation.error);
      return;
    }
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(settings.deletedActionName)({ metaFieldId }),
      `${settings.url}${metaFieldId}/`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/* ************************************  META FIELD VALUES  ************************************ */

const normalizeMetaFieldValueEntity = (entity) => {
  const normalizedEntity = { ...entity };
  delete normalizedEntity.meta_field_type_id;
  if (normalizedEntity.isNew) {
    delete normalizedEntity.id;
  }
  delete normalizedEntity.isNew;
  return normalizedEntity;
};

export const saveMetaFieldValues =
  (metaFieldType, settings = null) =>
  async (dispatch) => {
    const settingsValidation = validateSettings(settings);

    if (!settingsValidation.isValid) {
      console.error(settingsValidation.error);
      return;
    }
    const accessToken = await getAccessTokenSafely();
    const params = { access_token: accessToken };

    // These elements must be processed sequentially due to the computation of the order
    for (const value of metaFieldType.values) {
      const normalizedEntity = normalizeMetaFieldValueEntity(value);
      if (normalizedEntity.id) {
        await putRequest(
          null,
          createAction(settings.updatedActionName),
          `${settings.url}${value.id}/`,
          normalizedEntity,
          authErrorHandler,
          value
        )(params)(dispatch);
      } else {
        await postRequest(
          null,
          createAction(settings.addedActionName),
          settings.url,
          normalizedEntity,
          authErrorHandler,
          value
        )(params)(dispatch);
      }
    }
  };

export const deleteMetaFieldTypeValue =
  (metaFieldId, valueId, settings = null) =>
  async (dispatch) => {
    const settingsValidation = validateSettings(settings);

    if (!settingsValidation.isValid) {
      console.error(settingsValidation.error);
      return;
    }
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(settings.deletedActionName)({
        metaFieldId,
        valueId
      }),
      `${settings.url}${valueId}/`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/* ************************************  FILES (IMAGES/MATERIALS)  ************************************ */

export const saveFiles =
  (files, settings = null) =>
  async (dispatch) => {
    const settingsValidation = validateSettings(settings);

    if (!settingsValidation.isValid) {
      console.error(settingsValidation.error);
      return;
    }
    const accessToken = await getAccessTokenSafely();
    const params = { access_token: accessToken };

    const promises = files.map((file) => {
      if (file.id) {
        return putRequest(
          null,
          createAction(settings.updatedActionName),
          `${settings.url}${file.id}/`,
          file,
          authErrorHandler,
          file
        )(params)(dispatch);
      }
      return postRequest(
        null,
        createAction(settings.addedActionName),
        settings.url,
        file,
        authErrorHandler,
        file
      )(params)(dispatch);
    });

    return Promise.all(promises);
  };

export const deleteFile =
  (fileId, settings = null) =>
  async (dispatch) => {
    const settingsValidation = validateSettings(settings);

    if (!settingsValidation.isValid) {
      console.error(settingsValidation.error);
      return;
    }
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(settings.deletedActionName)({ fileId }),
      `${settings.url}/${fileId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/* ************************************  ARCHIVE  ************************************ */

export const archiveItem =
  (item, settings = null) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const params = { access_token: accessToken };

    return putRequest(
      null,
      createAction(settings.updatedActionName),
      `${settings.url}`,
      item,
      authErrorHandler,
      item
    )(params)(dispatch);
  };

export const unarchiveItem =
  (item, settings = null) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const params = { access_token: accessToken };

    dispatch(startLoading());

    return deleteRequest(
      null,
      createAction(settings.deletedActionName)(item.id),
      `${settings.url}`,
      null,
      authErrorHandler,
      item
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
