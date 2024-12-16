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

import React, { useState, useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import {
  Dropdown,
  Input,
  TextEditor
} from "openstack-uicore-foundation/lib/components";
import FormRepeater from "../form-repeater";
import {
  scrollToError,
  shallowEqual,
  hasErrors
} from "../../utils/methods";

const InventoryItemForm = ({
  entity: initialEntity,
  errors: initialErrors,
  onSubmit
}) => {
  const [entity, setEntity] = useState({ ...initialEntity });
  const [errors, setErrors] = useState(initialErrors);

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

  const handleChange = (ev) => {
    const { id, value, checked, type } = ev.target;
    setEntity((prevEntity) => ({
      ...prevEntity,
      [id]: type === "checkbox" ? checked : value
    }));
    setErrors((prevErrors) => ({ ...prevErrors, [id]: "" }));
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    onSubmit(entity);
  };

  // const renderLineContent = (line, updateValue) => (
  const renderLineContent = () => (
    <div className="row form-group">
      <div className="col-md-3">
        <Input
          id="meta-field-title"
          className="form-control"
          // error={hasErrors("meta-field-title", errors)}
          onChange={handleChange}
          value={entity.code}
          placeholder="Field Title"
        />
      </div>
      <div className="col-md-2">
        <div className="form-check abc-checkbox">
          <input
            type="checkbox"
            id="is_required"
            checked={false}
            onChange={handleChange}
            className="form-check-input"
          />
          <label className="form-check-label" htmlFor="is_required">
            Required
          </label>
        </div>
      </div>
      <div className="col-md-2">
        <Dropdown
          id="meta-field-type"
          placeholder="Field Type"
          // value={enabledFilters}
          onChange={() => {}}
          // options={(filters_ddl) => {}}
        />
      </div>
      <div className="col-md-3">
        <Input
          id="meta-field-value"
          className="form-control"
          // error={hasErrors("meta-field-title", errors)}
          onChange={handleChange}
          value={entity.code}
          placeholder="Field Value"
        />
      </div>
    </div>
  );

  return (
    <form className="badge-type-form">
      <input type="hidden" id="id" value={entity.id} />
      <input type="hidden" id="order" value={entity.order} />
      <div className="row form-group">
        <div className="col-md-4">
          <label>{T.translate("edit_inventory_item.code")} *</label>
          <Input
            id="code"
            className="form-control"
            error={hasErrors("code", errors)}
            onChange={handleChange}
            value={entity.code}
          />
        </div>
        <div className="col-md-8">
          <label>{T.translate("edit_inventory_item.name")} *</label>
          <Input
            id="name"
            className="form-control"
            error={hasErrors("name", errors)}
            onChange={handleChange}
            value={entity.name}
          />
        </div>
      </div>

      <div className="row form-group">
        <div className="col-md-12">
          <label>{T.translate("edit_inventory_item.description")} *</label>
          <TextEditor
            id="description"
            value={entity.description}
            onChange={handleChange}
            error={hasErrors("description", errors)}
          />
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col-md-12">
          <FormRepeater renderContent={renderLineContent} />
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col-md-12 submit-buttons">
          <input
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary pull-right"
            value={T.translate("general.save")}
          />
        </div>
      </div>
    </form>
  );
};

export default InventoryItemForm;
