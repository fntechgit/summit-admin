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

import React from "react";
import MuiFormikCheckbox from "../../formik-inputs/mui-formik-checkbox";
import MuiFormikDropdownCheckbox from "../../formik-inputs/mui-formik-dropdown-checkbox";
import MuiFormikDropdownRadio from "../../formik-inputs/mui-formik-dropdown-radio";
import MuiFormikDatepicker from "../../formik-inputs/mui-formik-datepicker";
import MuiFormikTimepicker from "../../formik-inputs/mui-formik-timepicker";
import MuiFormikTextField from "../../formik-inputs/mui-formik-textfield";
import MuiFormikSelectV2 from "../../formik-inputs/mui-formik-select-v2";

const ItemTableField = ({
  rowId,
  field,
  timeZone,
  label = "",
  disabled = false
}) => {
  const name = `i-${rowId}-c-${field.class_field}-f-${field.type_id}`;
  const commonProps = { name, label, disabled };

  switch (field.type) {
    case "CheckBox":
      return <MuiFormikCheckbox {...commonProps} size="small" />;
    case "CheckBoxList":
      return (
        <MuiFormikDropdownCheckbox
          {...commonProps}
          size="small"
          options={field.values.map((v) => ({ value: v.id, label: v.value }))}
        />
      );
    case "RadioButtonList":
      return (
        <MuiFormikDropdownRadio
          {...commonProps}
          size="small"
          options={field.values.map((v) => ({ value: v.id, label: v.value }))}
        />
      );
    case "DateTime":
      return <MuiFormikDatepicker {...commonProps} />;
    case "Time":
      return <MuiFormikTimepicker {...commonProps} timeZone={timeZone} />;
    case "Quantity":
      return (
        <MuiFormikTextField
          {...commonProps}
          fullWidth
          size="small"
          type="number"
          slotProps={{
            htmlInput: {
              min: field.minimum_quantity,
              ...(field.maximum_quantity > 0
                ? { max: field.maximum_quantity }
                : {})
            }
          }}
        />
      );
    case "ComboBox":
      return (
        <MuiFormikSelectV2
          {...commonProps}
          size="small"
          options={field.values.map((v) => ({ value: v.id, label: v.value }))}
        />
      );
    case "Text":
      return <MuiFormikTextField {...commonProps} fullWidth size="small" />;
    case "TextArea":
      return (
        <MuiFormikTextField
          {...commonProps}
          fullWidth
          size="small"
          multiline
          rows={3}
        />
      );
  }
};

export default ItemTableField;
