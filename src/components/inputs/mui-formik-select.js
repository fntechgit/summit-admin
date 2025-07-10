import React from "react";
import PropTypes from "prop-types";
import { Select, FormHelperText, FormControl } from "@mui/material";

const MuiFormikSelect = ({ name, formik, children, ...rest }) => {
  const { errors, values, touched, handleChange } = formik;

  return (
    <FormControl fullWidth error={touched[name] && Boolean(errors[name])}>
      <Select
        name={name}
        value={values[name]}
        onChange={handleChange}
        displayEmpty
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
      >
        {children}
      </Select>
      {touched[name] && errors[name] && (
        <FormHelperText>{errors[name]}</FormHelperText>
      )}
    </FormControl>
  );
};

MuiFormikSelect.propTypes = {
  name: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};

export default MuiFormikSelect;
