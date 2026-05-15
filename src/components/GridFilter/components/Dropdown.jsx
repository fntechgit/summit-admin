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
import T from "i18n-react/dist/i18n-react";
import { Select, FormControl, MenuItem, InputLabel } from "@mui/material";
import PropTypes from "prop-types";

const Dropdown = ({
  id,
  value,
  options,
  placeholder,
  label,
  onChange,
  ...rest
}) => {
  const finalPlaceholder =
    placeholder || T.translate("general.select_an_option");

  return (
    <FormControl fullWidth>
      {label && <InputLabel id={`${id}-label`}>{label}</InputLabel>}
      <Select
        value={value}
        label={label}
        onChange={onChange}
        labelId={`${id}-label`}
        displayEmpty
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
        renderValue={(selected) => {
          if (
            selected == null ||
            selected === "" ||
            (Array.isArray(selected) && selected.length === 0)
          ) {
            return <em>{finalPlaceholder}</em>;
          }
          if (Array.isArray(selected)) {
            const lookup = Object.fromEntries(
              options.map((o) => [o.value, o.label])
            );
            return selected
              .map((v) => lookup[v])
              .filter(Boolean)
              .join(", ");
          }
          const selectedOption = options.find(
            ({ value }) => value === selected
          );
          return selectedOption ? selectedOption.label : "";
        }}
      >
        {options?.map((op) => (
          <MenuItem key={`selectop-${op.value}`} value={op.value}>
            {op.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

Dropdown.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array
  ]),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

Dropdown.defaultProps = {
  value: null,
  label: "",
  placeholder: ""
};

export default Dropdown;
