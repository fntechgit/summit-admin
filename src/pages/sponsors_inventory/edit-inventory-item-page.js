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
  getInventoryItem,
  resetInventoryItemForm,
  saveInventoryItem,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue,
  deleteInventoryItemImage
} from "../../actions/inventory-item-actions";

const EditInventoryItemPage = (props) => {
  const {
    match,
    loading,
    entity,
    errors,
    getInventoryItem,
    resetInventoryItemForm,
    saveInventoryItem,
    deleteInventoryItemMetaFieldType,
    deleteInventoryItemMetaFieldTypeValue,
    deleteInventoryItemImage
  } = props;
  const inventoryItemId = match.params.inventory_item_id;

  useEffect(() => {
    if (!inventoryItemId) {
      resetInventoryItemForm();
    } else {
      getInventoryItem(inventoryItemId);
    }
  }, [inventoryItemId, getInventoryItem, resetInventoryItemForm]);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  if (loading) return null;

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("edit_inventory_item.inventory_item")}
      </h3>
      <hr />
      <InventoryItemForm
        entity={entity}
        errors={errors}
        onMetaFieldTypeDeleted={deleteInventoryItemMetaFieldType}
        onMetaFieldTypeValueDeleted={deleteInventoryItemMetaFieldTypeValue}
        onImageDeleted={deleteInventoryItemImage}
        onSubmit={saveInventoryItem}
      />
    </div>
  );
};

const mapStateToProps = ({ currentInventoryItemState, baseState }) => ({
  ...currentInventoryItemState,
  loading: baseState.loading
});

export default connect(mapStateToProps, {
  getInventoryItem,
  resetInventoryItemForm,
  saveInventoryItem,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue,
  deleteInventoryItemImage
})(EditInventoryItemPage);
