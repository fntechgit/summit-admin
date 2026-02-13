import React from "react";
import PropTypes from "prop-types";
import { InputAdornment } from "@mui/material";
import { useField, useFormikContext, getIn } from "formik";
import MuiFormikTextField from "./mui-formik-textfield";

const BLOCKED_KEYS = ["e", "E", "+", "-", ".", ","];
const BYTES_PER_MB = 1_000_000;

const MuiFormikFilesizeField = ({ name, label, ...props }) => {
  const [field, meta, helpers] = useField(name);
  const { initialValues } = useFormikContext();

  const displayValue =
    field.value !== null && field.value !== "" && field.value !== undefined
      ? Math.floor(field.value / BYTES_PER_MB)
      : "";

  const emptyValue = getIn(initialValues, name) === null ? null : "";

  const handleChange = (e) => {
    const mbValue = e.target.value;

    if (mbValue === "" || mbValue === null || mbValue === undefined) {
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
      value={displayValue}
      onChange={handleChange}
      onBlur={() => helpers.setTouched(true)}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
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
