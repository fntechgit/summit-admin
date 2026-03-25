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
import {
  Checkbox,
  Divider,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select
} from "@mui/material";
import { useField } from "formik";
import T from "i18n-react/dist/i18n-react";

const MuiFormikDropdownCheckbox = ({
  name,
  label,
  options,
  placeholder,
  ...rest
}) => {
  const [field, meta, helpers] = useField(name);
  const finalPlaceholder =
    placeholder || T.translate("general.select_an_option");
  const allSelected = options.every(({ value }) =>
    field.value?.includes(value)
  );

  const handleChange = (event) => {
    const { value } = event.target;

    // If "all" was clicked
    if (value.includes("all")) {
      if (allSelected) {
        helpers.setValue([]);
      } else {
        helpers.setValue(options.map((opt) => opt.value));
      }
    } else {
      helpers.setValue(value);
    }
  };

  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
      {label && (
        <InputLabel shrink id={`${name}-label`}>
          {label}
        </InputLabel>
      )}
      <Select
        variant="outlined"
        name={name}
        label={label}
        labelId={`${name}-label`}
        multiple
        value={field.value || []}
        onChange={handleChange}
        onBlur={field.onBlur}
        displayEmpty
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
        renderValue={(selected) => {
          if (!selected?.length) {
            return <em>{finalPlaceholder}</em>;
          }
          if (allSelected) {
            return T.translate("general.all");
          }
          const selectedNames = options
            .filter(({ value }) => selected?.includes(value))
            .map(({ label }) => label);
          return selectedNames.join(", ");
        }}
      >
        <MenuItem key="all" value="all">
          <Checkbox checked={allSelected} />
          <ListItemText primary={T.translate("general.all")} />
        </MenuItem>
        <Divider />
        {options.map(({ label, value }) => (
          <MenuItem key={`ckbx-ddl-${value}`} value={value}>
            <Checkbox checked={field.value?.includes(value)} />
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MuiFormikDropdownCheckbox;
