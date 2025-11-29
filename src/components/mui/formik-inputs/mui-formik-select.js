import React from "react";
import PropTypes from "prop-types";
import {
  Select,
  FormHelperText,
  FormControl,
  InputAdornment,
  IconButton
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useField } from "formik";

const MuiFormikSelect = ({ name, children, isClearable, ...rest }) => {
  const [field, meta, helpers] = useField(name);

  const handleClear = (ev) => {
    ev.stopPropagation();
    helpers.setValue("");
  };

  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
      <Select
        name={name}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...field}
        displayEmpty
        endAdornment={
          isClearable && field.value ? (
            <InputAdornment position="end" sx={{ mr: 2 }}>
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }
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
  children: PropTypes.node.isRequired,
  isClearable: PropTypes.bool
};

export default MuiFormikSelect;
