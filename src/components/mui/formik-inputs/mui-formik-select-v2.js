import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Select,
  FormHelperText,
  FormControl,
  MenuItem,
  InputLabel
} from "@mui/material";
import { useField } from "formik";

const MuiFormikSelectV2 = ({ name, label, placeholder, options, ...rest }) => {
  const [field, meta] = useField(name);
  const finalPlaceholder =
    placeholder || T.translate("general.select_an_option");

  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
      {label && <InputLabel id={`${name}-label`}>{label}</InputLabel>}
      <Select
        name={name}
        label={label}
        labelId={`${name}-label`}
        displayEmpty
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...field}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
        renderValue={(selected) => {
          if (!selected) {
            return <em>{finalPlaceholder}</em>;
          }
          const selectedOption = options.find(
            ({ value }) => value === selected
          );
          return selectedOption ? selectedOption.label : "";
        }}
      >
        {options.map((op) => (
          <MenuItem key={`selectop-${op.value}`} value={op.value}>
            {op.label}
          </MenuItem>
        ))}
      </Select>
      {meta.touched && meta.error && (
        <FormHelperText>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
};

MuiFormikSelectV2.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired
};

export default MuiFormikSelectV2;
