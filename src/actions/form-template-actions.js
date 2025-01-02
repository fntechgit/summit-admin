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

export const ADD_FORM_TEMPLATE = "ADD_FORM_TEMPLATE";
export const CHANGE_FORM_TEMPLATE_SEARCH_TERM =
  "CHANGE_FORM_TEMPLATE_SEARCH_TERM";
export const FORM_TEMPLATE_ADDED = "FORM_TEMPLATE_ADDED";
export const FORM_TEMPLATE_DELETED = "FORM_TEMPLATE_DELETED";
export const FORM_TEMPLATE_UPDATED = "FORM_TEMPLATE_UPDATED";
export const RECEIVE_FORM_TEMPLATE = "RECEIVE_FORM_TEMPLATE";
export const RECEIVE_FORM_TEMPLATES = "RECEIVE_FORM_TEMPLATES";
export const REQUEST_FORM_TEMPLATES = "REQUEST_FORM_TEMPLATES";
export const RESET_FORM_TEMPLATE_FORM = "RESET_FORM_TEMPLATE_FORM";
export const UPDATE_FORM_TEMPLATE = "UPDATE_FORM_TEMPLATE";
export const ADD_FORM_TEMPLATE_MATERIAL = "ADD_FORM_TEMPLATE_MATERIAL";
export const ADD_FORM_TEMPLATE_META_FIELD_TYPE =
  "ADD_FORM_TEMPLATE_META_FIELD_TYPE";
export const FORM_TEMPLATE_META_FIELD_SAVED = "FORM_TEMPLATE_META_FIELD_SAVED";
export const FORM_TEMPLATE_META_FIELD_DELETED =
  "FORM_TEMPLATE_META_FIELD_DELETED";
export const FORM_TEMPLATE_META_FIELD_VALUE_SAVED =
  "FORM_TEMPLATE_META_FIELD_VALUE_SAVED";
export const FORM_TEMPLATE_META_FIELD_VALUE_DELETED =
  "FORM_TEMPLATE_META_FIELD_VALUE_DELETED";
export const FORM_TEMPLATE_MATERIAL_SAVED = "FORM_TEMPLATE_MATERIAL_SAVED";
export const FORM_TEMPLATE_MATERIAL_DELETED = "FORM_TEMPLATE_MATERIAL_DELETED";

export const getFormTemplates =
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
      fields: "id,code,name",
      relations: "items",
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
      createAction(REQUEST_FORM_TEMPLATES),
      createAction(RECEIVE_FORM_TEMPLATES),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/`,
      authErrorHandler,
      { order, orderDir, page, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getFormTemplate = (formTemplateId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "materials,meta_fields,meta_fields.values"
  };

  return getRequest(
    null,
    createAction(RECEIVE_FORM_TEMPLATE),
    `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const deleteFormTemplate = (formTemplateId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(FORM_TEMPLATE_DELETED)({ formTemplateId }),
    `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplateId}/`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetFormTemplateForm = () => (dispatch) => {
  dispatch(createAction(RESET_FORM_TEMPLATE_FORM)({}));
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };
  normalizedEntity.meta_fields = normalizedEntity.meta_fields?.filter(
    (mf) => mf.name
  );
  return normalizedEntity;
};

export const saveFormTemplate = (entity) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = {
    access_token: accessToken,
    expand: "materials,meta_fields,meta_fields.values"
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_FORM_TEMPLATE),
      createAction(FORM_TEMPLATE_UPDATED),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${entity.id}/`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        const promises = [];

        if (entity.materials.length > 0) {
          promises.push(saveFormTemplateMaterials(normalizedEntity)(dispatch));
        }

        if (entity.meta_fields.length > 0) {
          promises.push(
            saveFormTemplateMetaFieldTypes(normalizedEntity)(dispatch)
          );
        }

        Promise.all(promises)
          .then(() => {
            dispatch(
              showSuccessMessage(
                T.translate("edit_form_template.form_template_saved")
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
    createAction(ADD_FORM_TEMPLATE),
    createAction(FORM_TEMPLATE_ADDED),
    `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch)
    .then(({ response }) => {
      const formTemplate = { ...normalizedEntity, id: response.id };
      const promises = [];

      if (entity.materials.length > 0) {
        promises.push(saveFormTemplateMaterials(formTemplate)(dispatch));
      }

      if (entity.meta_fields.length > 0) {
        promises.push(saveFormTemplateMetaFieldTypes(formTemplate)(dispatch));
      }

      Promise.all(promises)
        .then(() => {
          dispatch(
            showMessage(success_message, () => {
              history.push("/app/sponsors-inventory");
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

const normalizeMetaFieldEntity = (entity) => ({
  ...entity,
  is_required: !!entity.is_required
});

const saveFormTemplateMetaFieldTypes = (formTemplate) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = {
    access_token: accessToken,
    expand: "values"
  };

  const promises = formTemplate.meta_fields.map((metaFieldType) => {
    const normalizedEntity = normalizeMetaFieldEntity(metaFieldType);

    if (metaFieldType.id) {
      return putRequest(
        null,
        createAction(FORM_TEMPLATE_META_FIELD_SAVED),
        `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplate.id}/meta-field-types/${metaFieldType.id}/`,
        normalizedEntity,
        authErrorHandler,
        metaFieldType
      )(params)(dispatch).then(() => {
        if (metaFieldType.values.length > 0) {
          saveMetaFieldValues(formTemplate.id, metaFieldType)(dispatch);
        }
      });
    }
    return postRequest(
      null,
      createAction(FORM_TEMPLATE_META_FIELD_SAVED),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${formTemplate.id}/meta-field-types/`,
      normalizedEntity,
      authErrorHandler,
      metaFieldType
    )(params)(dispatch).then(({ response }) => {
      if (metaFieldType.values?.length > 0) {
        const metaField = { ...metaFieldType, id: response.id };
        saveMetaFieldValues(formTemplate.id, metaField)(dispatch);
      }
    });
  });

  return Promise.all(promises).catch((err) => {
    console.error(err);
  });
};

export const deleteFormTemplateMetaFieldType =
  (templateId, metaFieldId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(FORM_TEMPLATE_META_FIELD_DELETED)({ metaFieldId }),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${templateId}/meta-field-types/${metaFieldId}/`,
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
  (templateId, metaFieldType) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const params = { access_token: accessToken };

    // These elements must be processed sequentially due to the computation of the order
    for (const value of metaFieldType.values) {
      const normalizedEntity = normalizeMetaFieldValueEntity(value);
      if (normalizedEntity.id) {
        await putRequest(
          null,
          createAction(FORM_TEMPLATE_META_FIELD_VALUE_SAVED),
          `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${templateId}/meta-field-types/${metaFieldType.id}/values/${normalizedEntity.id}/`,
          normalizedEntity,
          authErrorHandler,
          value
        )(params)(dispatch);
      } else {
        await postRequest(
          null,
          createAction(FORM_TEMPLATE_META_FIELD_VALUE_SAVED),
          `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${templateId}/meta-field-types/${metaFieldType.id}/values/`,
          normalizedEntity,
          authErrorHandler,
          value
        )(params)(dispatch);
      }
    }
  };

export const deleteFormTemplateMetaFieldTypeValue =
  (templateId, metaFieldId, valueId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(FORM_TEMPLATE_META_FIELD_VALUE_DELETED)({
        metaFieldId,
        valueId
      }),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${templateId}/meta-field-types/${metaFieldId}/values/${valueId}/`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/* ************************************  MATERIALS  ************************************ */

const saveFormTemplateMaterials = (template) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  const promises = template.materials.map((material) => {
    if (material.id) {
      return putRequest(
        null,
        createAction(FORM_TEMPLATE_MATERIAL_SAVED),
        `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${template.id}/materials/${material.id}/`,
        material,
        authErrorHandler,
        material
      )(params)(dispatch);
    }
    return postRequest(
      null,
      createAction(FORM_TEMPLATE_MATERIAL_SAVED),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${template.id}/materials/`,
      material,
      authErrorHandler,
      material
    )(params)(dispatch);
  });

  return Promise.all(promises);
};

export const deleteFormTemplateMaterial =
  (templateId, materialId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(FORM_TEMPLATE_MATERIAL_DELETED)({ materialId }),
      `${window.INVENTORY_API_BASE_URL}/api/v1/form-templates/${templateId}/materials/${materialId}/`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
