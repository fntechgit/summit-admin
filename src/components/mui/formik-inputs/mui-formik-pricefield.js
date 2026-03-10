import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { InputAdornment } from "@mui/material";
import { useField } from "formik";
import {
  amountFromCents,
  amountToCents
} from "openstack-uicore-foundation/lib/utils/money";
import MuiFormikTextField from "./mui-formik-textfield";

const BLOCKED_KEYS = ["e", "E", "+", "-"];

const MuiFormikPriceField = ({
  name,
  label,
  inCents = false,
  inputProps = { step: 0.01 },
  ...props
}) => {
  // eslint-disable-next-line no-unused-vars
  const [field, meta, helpers] = useField(name);
  const initialValue = inCents
    ? amountFromCents(field.value || 0)
    : field.value;
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

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
          startAdornment: <InputAdornment position="start">$</InputAdornment>
        }
      }}
      onKeyDown={(e) => {
        if (BLOCKED_KEYS.includes(e.key)) {
          e.nativeEvent.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
      inputProps={{
        min: 0,
        inputMode: "decimal",
        ...inputProps
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

MuiFormikPriceField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
};

export default MuiFormikPriceField;
