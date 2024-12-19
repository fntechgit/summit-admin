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

import React, { useEffect, useState, useRef } from "react";
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import { Dropdown, Input } from "openstack-uicore-foundation/lib/components";
import FormRepeater, { ButtonPanelAlignment } from "../form-repeater";
import InventoryItemMetaFieldValueForm from "./inventory-item-meta-field-value-form";
import { hasErrors } from "../../utils/methods";

const InventoryItemMetaFieldForm = ({
  entity: initialEntity,
  errors, // : initialErrors,
  index,
  onMetaFieldValueDeleted,
  onChange
}) => {
  const metaFieldValuesRepeaterRef = useRef(null);
  const valuesRef = useRef([]);
  const [entity, setEntity] = useState({ ...initialEntity });
  // const [errors, setErrors] = useState(initialErrors);

  useEffect(() => {
    if (onChange) {
      console.log("InventoryItemMetaFieldForm::useEffect onChange", entity);
      onChange(entity);
    }
  }, [entity]);

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
      values: valuesRef.current,
      [id]: type === "checkbox" ? checked : value
    }));
  };

  const getMetaFieldValueLines = (metaFieldValues) =>
    metaFieldValues
      .filter((metaFieldValue) => metaFieldValue.id)
      .map((metaFieldValue) => ({
        id: metaFieldValue.id,
        value: { ...metaFieldValue }
      }));

  const handleRemoveMetaFieldValue = (metaField) => {
    if (onMetaFieldValueDeleted && metaField.value.id) {
      onMetaFieldValueDeleted(entity.id, metaField.value.id);
    }
  };

  const renderMetaFieldValueForm = (line, updateValue) => {
    const handleChange = (metaFieldValue) => {
      const values = valuesRef.current.filter(
        (value) => value.name !== metaFieldValue.name
      );
      valuesRef.current = [...values, metaFieldValue];
      updateValue(metaFieldValue);
    };

    return (
      <InventoryItemMetaFieldValueForm
        entity={line.value}
        errors={errors}
        index={line.id}
        onChange={handleChange}
      />
    );
  };

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
                checked={entity.is_required}
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
        <div className="row form-group">
          <div className="col-md-7 col-md-offset-5">
            <label>
              {T.translate("edit_inventory_item.meta_field_values")}
            </label>
            <FormRepeater
              ref={metaFieldValuesRepeaterRef}
              initialLines={getMetaFieldValueLines(entity?.values ?? [])}
              renderContent={renderMetaFieldValueForm}
              onLineRemoved={handleRemoveMetaFieldValue}
              buttonsPanelAlignment={ButtonPanelAlignment.BOTTOM}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryItemMetaFieldForm;
