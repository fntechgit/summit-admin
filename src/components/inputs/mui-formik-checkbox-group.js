import React from "react";
import PropTypes from "prop-types";
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  FormGroup,
  Checkbox
} from "@mui/material";
import { useField } from "formik";

const MuiFormikCheckboxGroup = ({ name, label, options, ...props }) => {
  const [field, meta] = useField({ name });

  return (
    <FormControl
      fullWidth
      margin="normal"
      error={meta.touched && Boolean(meta.error)}
    >
      {label && <FormLabel id="radio-group-label">{label}</FormLabel>}
      <FormGroup
        aria-labelledby="checkbox-group-label"
        defaultValue={field.value}
        name={name}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...field}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      >
        {options.map((op) => (
          <FormControlLabel value={op.value} control={<Checkbox />} label={op.label} />
        ))}
      </FormGroup>
      {meta.touched && meta.error && (
        <FormHelperText>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
};

MuiFormikCheckboxGroup.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  options: PropTypes.array.isRequired
};

export default MuiFormikCheckboxGroup;
