import React from "react";
import PropTypes from "prop-types";
import { Select, FormHelperText, FormControl } from "@mui/material";
import { useField } from "formik";

const MuiFormikSelect = ({ name, children, ...rest }) => {
  const [field, meta] = useField(name);
  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
      <Select
        name={name}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...field}
        displayEmpty
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
      >
        {children}
      </Select>
      {meta.touched && meta.error && (
        <FormHelperText>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
};

MuiFormikSelect.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default MuiFormikSelect;
