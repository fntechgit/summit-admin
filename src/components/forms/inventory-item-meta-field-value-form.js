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

import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { Input } from "openstack-uicore-foundation/lib/components";
import { hasErrors, scrollToError, shallowEqual } from "../../utils/methods";

const InventoryItemMetaFieldValueForm = ({
  entity: initialEntity,
  errors: initialErrors,
  onChange
}) => {
  const [entity, setEntity] = useState({ ...initialEntity });
  const [errors, setErrors] = useState(initialErrors);

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

  const handleMetaFieldValueChange = (id, ev) => {
    const { value, checked, type } = ev.target;

    setEntity((prevEntity) => ({
      ...prevEntity,
      [id]: type === "checkbox" ? checked : value
    }));
  };

  return (
    <div className="row form-group">
      <div className="col-md-6">
        <Input
          id="name"
          value={entity.name}
          className="form-control"
          error={hasErrors("name", errors)}
          onChange={(ev) => {
            handleMetaFieldValueChange("name", ev);
          }}
          placeholder={T.translate(
            "edit_inventory_item.placeholders.meta_field_value_name"
          )}
        />
      </div>
      <div className="col-md-6">
        <Input
          id="value"
          value={entity.value}
          className="form-control"
          error={hasErrors("value", errors)}
          onChange={(ev) => {
            handleMetaFieldValueChange("value", ev);
          }}
          placeholder={T.translate(
            "edit_inventory_item.placeholders.meta_field_value_value"
          )}
        />
      </div>
    </div>
  );
};

export default InventoryItemMetaFieldValueForm;
