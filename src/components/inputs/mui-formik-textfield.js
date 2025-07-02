import React from "react";
import PropTypes from "prop-types";
import { TextField } from "@mui/material";

const MuiFormikTextField = ({ name, label, formik, ...rest }) => {
  const { errors, values, touched, handleChange } = formik;

  return (
    <TextField
      name={name}
      label={label}
      value={values[name]}
      margin="normal"
      onChange={handleChange}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
};

MuiFormikTextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired
};

export default MuiFormikTextField;
