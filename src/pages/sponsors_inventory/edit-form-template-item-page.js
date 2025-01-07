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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import InventoryItemForm from "../../components/forms/inventory-item-form";
import {
  getFormTemplateItem,
  resetFormTemplateItemForm,
  saveFormTemplateItem,
  deleteItemMetaFieldType,
  deleteItemMetaFieldTypeValue,
  deleteItemImage
} from "../../actions/form-template-item-actions";

const EditFormTemplateItemPage = (props) => {
  const {
    match,
    formTemplateId,
    entity,
    errors,
    getFormTemplateItem,
    resetFormTemplateItemForm,
    saveFormTemplateItem,
    deleteItemMetaFieldType,
    deleteItemMetaFieldTypeValue,
    deleteItemImage
  } = props;
  const formTemplateItemId = match.params.form_template_item_id;

  useEffect(() => {
    if (!formTemplateItemId) {
      resetFormTemplateItemForm();
    } else {
      getFormTemplateItem(formTemplateId, formTemplateItemId);
    }
  }, [
    formTemplateId,
    formTemplateItemId,
    getFormTemplateItem,
    resetFormTemplateItemForm
  ]);

  const handleSubmit = (entity) => {
    saveFormTemplateItem(formTemplateId, entity);
  };

  const handleMetaFieldTypeDelete = (formTemplateItemId, metaFieldId) => {
    deleteItemMetaFieldType(formTemplateId, formTemplateItemId, metaFieldId);
  };

  const handleMetaFieldTypeValueDelete = (
    formTemplateItemId,
    metaFieldId,
    metaFieldValueId
  ) => {
    deleteItemMetaFieldTypeValue(
      formTemplateId,
      formTemplateItemId,
      metaFieldId,
      metaFieldValueId
    );
  };

  const handleImageDelete = (formTemplateItemId, imageId) => {
    deleteItemImage(formTemplateId, formTemplateItemId, imageId);
  };

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("edit_form_template_item.form_template_item")}
      </h3>
      <hr />
      <InventoryItemForm
        entity={entity}
        errors={errors}
        onMetaFieldTypeDeleted={handleMetaFieldTypeDelete}
        onMetaFieldTypeValueDeleted={handleMetaFieldTypeValueDelete}
        onImageDeleted={handleImageDelete}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

const mapStateToProps = ({ currentFormTemplateItemState }) => ({
  ...currentFormTemplateItemState
});

export default connect(mapStateToProps, {
  getFormTemplateItem,
  resetFormTemplateItemForm,
  saveFormTemplateItem,
  deleteItemMetaFieldType,
  deleteItemMetaFieldTypeValue,
  deleteItemImage
})(EditFormTemplateItemPage);
