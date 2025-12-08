import React from "react";
import PropTypes from "prop-types";
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch
} from "@mui/material";
import { useField } from "formik";

const MuiFormikSwitch = ({ name, label, ...props }) => {
  const [field, meta] = useField({ name });

  return (
    <FormControl
      fullWidth
      margin="normal"
      error={meta.touched && Boolean(meta.error)}
    >
      <FormControlLabel
        control={
          <Switch
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

MuiFormikSwitch.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

export default MuiFormikSwitch;
