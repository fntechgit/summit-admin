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
import {
  amountFromCents,
  amountToCents
} from "openstack-uicore-foundation/lib/utils/money";
import MuiFormikTextField from "./mui-formik-textfield";
import { DISCOUNT_TYPES } from "../../../utils/constants";

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
  const initialValue = inCents
    ? amountFromCents(field.value || 0)
    : field.value;
  const [value, setValue] = useState(initialValue);

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

  const handleChange = () => {
    const val = parseFloat(value) || 0;
    const transformedVal = amountToCents(val);

    helpers.setValue(inCents ? transformedVal : val);
  };

  return (
    <MuiFormikTextField
      name={name}
      label={label}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleChange}
      type="number"
      slotProps={{
        input: {
          ...adornment,
          min: 0,
          ...inputProps
        }
      }}
      onKeyDown={(e) => {
        if (BLOCKED_KEYS.includes(e.key)) {
          e.nativeEvent.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
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
