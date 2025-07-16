import React from "react";
import PropTypes from "prop-types";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText
} from "@mui/material";
import { useField } from "formik";

const MuiFormikCheckbox = ({ name, label, ...props }) => {
  const [field, meta] = useField({ name, type: "checkbox" });

  return (
    <FormControl
      fullWidth
      margin="normal"
      error={meta.touched && Boolean(meta.error)}
    >
      <FormControlLabel
        control={
          <Checkbox
            name={name}
            {...field}
            checked={field.value}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
          />
        }
        label={label}
      />
      {meta.touched && meta.error && (
        <FormHelperText>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
};

MuiFormikCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

export default MuiFormikCheckbox;
