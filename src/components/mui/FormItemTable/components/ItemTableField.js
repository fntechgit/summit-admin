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
import { MenuItem } from "@mui/material";
import MuiFormikCheckbox from "../../formik-inputs/mui-formik-checkbox";
import MuiFormikDropdownCheckbox from "../../formik-inputs/mui-formik-dropdown-checkbox";
import MuiFormikDropdownRadio from "../../formik-inputs/mui-formik-dropdown-radio";
import MuiFormikDatepicker from "../../formik-inputs/mui-formik-datepicker";
import MuiFormikTimepicker from "../../formik-inputs/mui-formik-timepicker";
import MuiFormikTextField from "../../formik-inputs/mui-formik-textfield";
import MuiFormikSelect from "../../formik-inputs/mui-formik-select";

const ItemTableField = ({ rowId, field, timeZone, label = "" }) => {
  const name = `i-${rowId}-c-${field.class_field}-f-${field.type_id}`;

  switch (field.type) {
    case "CheckBox":
      return <MuiFormikCheckbox name={name} label={label} />;
    case "CheckBoxList":
      return (
        <MuiFormikDropdownCheckbox
          name={name}
          label={label}
          size="small"
          options={field.values.map((v) => ({ value: v.id, label: v.value }))}
        />
      );
    case "RadioButtonList":
      return (
        <MuiFormikDropdownRadio
          name={name}
          label={label}
          size="small"
          options={field.values.map((v) => ({ value: v.id, label: v.value }))}
        />
      );
    case "DateTime":
      return <MuiFormikDatepicker name={name} label={label} />;
    case "Time":
      return (
        <MuiFormikTimepicker name={name} timeZone={timeZone} label={label} />
      );
    case "Quantity":
      return (
        <MuiFormikTextField
          name={name}
          fullWidth
          label={label}
          size="small"
          type="number"
          slotProps={{
            input: {
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
        <MuiFormikSelect name={name} label={label} size="small">
          {field.values.map((v) => (
            <MenuItem key={`ddopt-${v.id}`} value={v.id}>
              {v.value}
            </MenuItem>
          ))}
        </MuiFormikSelect>
      );
    case "Text":
      return (
        <MuiFormikTextField name={name} label={label} fullWidth size="small" />
      );
    case "TextArea":
      return (
        <MuiFormikTextField
          name={name}
          label={label}
          fullWidth
          size="small"
          multiline
          rows={3}
        />
      );
  }
};

export default ItemTableField;
