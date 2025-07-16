import React from "react";
import PropTypes from "prop-types";
import { TextField } from "@mui/material";
import { useField } from "formik";

const MuiFormikTextField = ({ name, label, ...props }) => {
  const [field, meta] = useField(name);

  return (
    <TextField
      name={name}
      label={label}
      {...field}
      margin="normal"
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

MuiFormikTextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

export default MuiFormikTextField;
