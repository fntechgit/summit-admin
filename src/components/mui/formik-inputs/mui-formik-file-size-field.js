import React, { useState } from "react";
import PropTypes from "prop-types";
import { InputAdornment } from "@mui/material";
import { useField } from "formik";
import MuiFormikTextField from "./mui-formik-textfield";
import { BYTES_PER_MB, DECIMAL_DIGITS } from "../../../utils/constants";

const BLOCKED_KEYS = ["e", "E", "+", "-", ".", ","];

const MuiFormikFilesizeField = ({ name, label, ...props }) => {
  const [field, meta, helpers] = useField(name);
  const initialValue =
    field.value != null
      ? (field.value / BYTES_PER_MB).toFixed(DECIMAL_DIGITS)
      : 0;
  const [val, setVal] = useState(initialValue);
  const emptyValue = meta.initialValue === null ? null : 0;

  const handleChange = () => {
    const mbValue = val;

    if (mbValue === "") {
      helpers.setValue(emptyValue);
      return;
    }

    const bytes = Number(mbValue) * BYTES_PER_MB;
    helpers.setValue(bytes);
  };

  return (
    <MuiFormikTextField
      name={name}
      label={label}
      type="number"
      value={val}
      onChange={(ev) => setVal(ev.target.value)}
      onBlur={handleChange}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">MB</InputAdornment>
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
        inputMode: "numeric",
        step: 1
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

MuiFormikFilesizeField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
};

export default MuiFormikFilesizeField;
