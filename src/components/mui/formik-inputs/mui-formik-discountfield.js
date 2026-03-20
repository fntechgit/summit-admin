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

import React, { useState } from "react";
import PropTypes from "prop-types";
import { InputAdornment } from "@mui/material";
import { useField } from "formik";
import MuiFormikTextField from "./mui-formik-textfield";
import { DISCOUNT_TYPES, ONE_HUNDRED } from "../../../utils/constants";

const BLOCKED_KEYS = ["e", "E", "+", "-"];

const MuiFormikDiscountField = ({
  name,
  label,
  discountType,
  inCents = false,
  ...props
}) => {
  // eslint-disable-next-line no-unused-vars
  const [field, meta, helpers] = useField(name);
  const [cleared, setCleared] = useState(false);
  const emptyValue = meta.initialValue === null ? null : 0;

  const getDisplayValue = () => {
    if (cleared) return "";
    if (field.value == null || field.value === 0) {
      return field.value === 0 ? 0 : "";
    }
    return inCents ? field.value / ONE_HUNDRED : field.value;
  };

  const adornment =
    discountType === DISCOUNT_TYPES.RATE
      ? {
          endAdornment: <InputAdornment position="end">%</InputAdornment>
        }
      : {
          startAdornment: <InputAdornment position="start">$</InputAdornment>
        };

  const inputProps =
    discountType === DISCOUNT_TYPES.RATE
      ? { max: 100, inputMode: "numeric", step: 1 }
      : { inputMode: "decimal", step: 1 };

  const handleChange = (e) => {
    const newVal = e.target.value;

    if (newVal === "") {
      setCleared(true);
      helpers.setValue(emptyValue);
      return;
    }

    setCleared(false);
    const numericValue = Number(newVal);
    const newDiscount = inCents ? numericValue * ONE_HUNDRED : numericValue;

    helpers.setValue(newDiscount);
  };

  const handleKeyDown = (e) => {
    if (BLOCKED_KEYS.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <MuiFormikTextField
      name={name}
      label={label}
      value={getDisplayValue()}
      onChange={handleChange}
      type="number"
      slotProps={{
        input: {
          ...adornment
        },
        htmlInput: {
          min: 0,
          ...inputProps
        }
      }}
      onKeyDown={handleKeyDown}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

MuiFormikDiscountField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
};

export default MuiFormikDiscountField;
