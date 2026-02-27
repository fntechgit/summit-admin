/**
 * Copyright 2026 OpenStack Foundation
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

import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import {
  Dropdown,
  Input,
  SortableTable
} from "openstack-uicore-foundation/lib/components";
import Swal from "sweetalert2";
import { hasErrors, scrollToError, shallowEqual } from "../../utils/methods";
import { metafieldHasValues } from "../../actions/inventory-shared-actions";

const InventoryItemMetaFieldForm = ({
  entity: initialEntity,
  errors: initialErrors,
  index,
  onMetaFieldTypeValueDeleted,
  onChange
}) => {
  const [entity, setEntity] = useState({ ...initialEntity });
  const [errors, setErrors] = useState(initialErrors);
  const [currentValue, setCurrentValue] = useState(null);
  const [showValues, setShowValues] = useState(
    metafieldHasValues(initialEntity.type)
  );

  useEffect(() => {
    if (onChange && !shallowEqual(initialEntity, entity)) {
      onChange(entity);
    }
  }, [entity]);

  useEffect(() => {
    scrollToError(initialErrors);
    if (!shallowEqual(initialEntity, entity)) {
      setEntity({ ...initialEntity });
      setErrors({});
    }

    if (!shallowEqual(initialErrors, errors)) {
      setErrors({ ...initialErrors });
    }
  }, [initialEntity, initialErrors]);

  const meta_field_value_types_ddl = [
    { label: "CheckBox", value: "CheckBox" },
    { label: "CheckBoxList", value: "CheckBoxList" },
    { label: "ComboBox", value: "ComboBox" },
    { label: "RadioButtonList", value: "RadioButtonList" },
    { label: "Text", value: "Text" },
    { label: "TextArea", value: "TextArea" }
  ];

  const handleMetaFieldChange = (id, ev) => {
    const { value, checked, type } = ev.target;
    setEntity((prevEntity) => ({
      ...prevEntity,
      [id]: type === "checkbox" ? checked : value
    }));
    setShowValues(type === "dropdown" && metafieldHasValues(value));
  };

  const handleMetaFieldValueChange = (id, ev) => {
    const { value, checked, type } = ev.target;
    setCurrentValue((prevValue) => ({
      ...prevValue,
      [id]: type === "checkbox" ? checked : value
    }));
  };

  const handleEditValueRequest = (valueId) => {
    const selectedValue = entity.values.find((value) => value.id === valueId);
    setCurrentValue(selectedValue);
  };

  const handleCommitValue = () => {
    if (!currentValue || !currentValue.name || !currentValue.value) return;

    const formerValue = entity.values?.find(
      (v) => v.name === currentValue.name
    );
    const rest =
      entity.values
        ?.filter((v) => v.name !== currentValue.name)
        .map((v) => ({
          ...v,
          is_default: currentValue.is_default ? false : v.is_default
        })) ?? [];

    let value = null;
    if (formerValue) {
      value = { ...currentValue, id: formerValue.id, order: formerValue.order };
      if (formerValue.isNew) {
        value.isNew = formerValue.isNew;
      }
    } else {
      value = {
        ...currentValue,
        id: Date.now(),
        order: rest.length + 1,
        isNew: true
      };
    }

    setEntity((prevEntity) => ({
      ...prevEntity,
      values: [...rest, value]
    }));

    setCurrentValue(null);
  };

  const removeValueLocally = (value) => {
    const values = entity.values
      .filter((v) => v.id !== value.id)
      .map((v, ix) => ({ ...v, order: ix + 1 }));

    setEntity((prevEntity) => ({
      ...prevEntity,
      values: [...values]
    }));

    setCurrentValue(null);
  };

  const handleDeleteValue = (valueId) => {
    if (!onMetaFieldTypeValueDeleted) return;
    const value = entity.values.find((v) => v.id === valueId);
    if (value && value.isNew) {
      removeValueLocally(value);
      return;
    }

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("meta_field_values_list.delete_value_warning")} ${
        value.name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        onMetaFieldTypeValueDeleted(entity.id, valueId);
      }
    });
  };

  const columns = [
    { columnKey: "name", value: T.translate("meta_field_values_list.name") },
    { columnKey: "value", value: T.translate("meta_field_values_list.value") },
    {
      columnKey: "is_default",
      value: T.translate("meta_field_values_list.is_default"),
      render: (filter) => (filter.is_default ? "YES" : "NO")
    }
  ];

  const table_options = {
    actions: {
      edit: { onClick: handleEditValueRequest },
      delete: { onClick: handleDeleteValue }
    }
  };

  const sortedValues = entity.values
    ? entity.values.sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="panel panel-default">
      <div className="panel-body">
        <div className="row form-group">
          <div className="col-md-5">
            <label>
              {T.translate("edit_inventory_item.placeholders.meta_field_title")}
            </label>
            <Input
              id="name"
              value={entity.name}
              className="form-control"
              error={hasErrors("name", errors)}
              maxLength={200}
              onChange={(ev) => {
                handleMetaFieldChange("name", ev);
              }}
            />
          </div>
          <div className="col-md-4">
            <label>
              {T.translate("edit_inventory_item.placeholders.meta_field_type")}
            </label>
            <Dropdown
              id="type"
              value={entity.type}
              onChange={(ev) => {
                handleMetaFieldChange("type", ev);
              }}
              options={meta_field_value_types_ddl}
            />
          </div>
          <div className="col-md-3">
            <label />
            <div className="form-check abc-checkbox">
              <input
                id={`is_required_${index}`}
                type="checkbox"
                checked={entity.is_required ?? false}
                onChange={(ev) => {
                  handleMetaFieldChange("is_required", ev);
                }}
                className="form-check-input"
              />
              <label
                className="form-check-label"
                htmlFor={`is_required_${index}`}
              >
                {T.translate(
                  "edit_inventory_item.placeholders.meta_field_required"
                )}
              </label>
            </div>
          </div>
        </div>
        {showValues && (
          <div className="row form-group">
            <div className="col-md-12">
              <label>
                {T.translate("edit_inventory_item.meta_field_values")}
              </label>
              {sortedValues.length > 0 && (
                <div>
                  <SortableTable
                    options={table_options}
                    data={sortedValues}
                    columns={columns}
                    dropCallback={() => {}}
                    orderField="order"
                  />
                </div>
              )}
              <div className="row">
                <div className="col-md-3">
                  <Input
                    id="name"
                    value={currentValue?.name ?? ""}
                    className="form-control"
                    maxLength={100}
                    onChange={(ev) => {
                      handleMetaFieldValueChange("name", ev);
                    }}
                    placeholder={T.translate(
                      "meta_field_values_list.placeholders.name"
                    )}
                  />
                </div>
                <div className="col-md-3">
                  <Input
                    id="value"
                    value={currentValue?.value ?? ""}
                    className="form-control"
                    maxLength={100}
                    onChange={(ev) => {
                      handleMetaFieldValueChange("value", ev);
                    }}
                    placeholder={T.translate(
                      "meta_field_values_list.placeholders.value"
                    )}
                  />
                </div>
                <div className="col-md-4">
                  <div className="form-check abc-checkbox">
                    <input
                      id="is_default"
                      type="checkbox"
                      checked={currentValue?.is_default ?? false}
                      onChange={(ev) => {
                        handleMetaFieldValueChange("is_default", ev);
                      }}
                      className="form-check-input"
                    />
                    <label className="form-check-label" htmlFor="is_default">
                      {T.translate("meta_field_values_list.is_default")}
                    </label>
                  </div>
                </div>
                <div className="col-md-2">
                  <input
                    type="button"
                    onClick={handleCommitValue}
                    className="btn btn-default"
                    value={T.translate("meta_field_values_list.commit_value")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryItemMetaFieldForm;
