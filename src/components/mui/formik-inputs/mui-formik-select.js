import React from "react";
import PropTypes from "prop-types";
import {
  Select,
  FormHelperText,
  FormControl,
  InputAdornment,
  IconButton,
  InputLabel
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useField } from "formik";

const MuiFormikSelect = ({
  name,
                           label,
  placeholder,
  children,
  isClearable,
  ...rest
}) => {
  const [field, meta, helpers] = useField(name);

  const handleClear = (ev) => {
    ev.stopPropagation();
    helpers.setValue("");
  };

  const hasValue =
    field.value !== "" && field.value !== undefined && field.value !== null;

  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
      {label && (
        <InputLabel htmlFor={name} id={`${name}-label`} shrink={hasValue}>
          {label}
        </InputLabel>
      )}
      <Select
        name={name}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...field}
        labelId={`${name}-label`}
        label={label}
        notched={hasValue}
        displayEmpty
        renderValue={(selected) => {
          if (!selected || selected === "") {
            return <span style={{ color: "#aaa" }}>{placeholder}</span>;
          }
          return selected;
        }}
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
  placeholder: PropTypes.string,
  isClearable: PropTypes.bool
};

export default MuiFormikSelect;
