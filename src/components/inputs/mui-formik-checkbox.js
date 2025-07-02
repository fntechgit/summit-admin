import React from "react";
import PropTypes from "prop-types";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText
} from "@mui/material";

const MuiFormikCheckbox = ({ name, label, formik }) => {
  const { errors, values, touched, handleChange } = formik;

  return (
    <FormControl
      fullWidth
      margin="normal"
      error={touched[name] && Boolean(errors[name])}
    >
      <FormControlLabel
        control={
          <Checkbox
            name={name}
            checked={values[name]}
            onChange={handleChange}
          />
        }
        label={label}
      />
      {touched[name] && Boolean(errors[name]) && (
        <FormHelperText>
          {(touched[name] && errors[name]) ?? " "}
        </FormHelperText>
      )}
    </FormControl>
  );
};

MuiFormikCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired
};

export default MuiFormikCheckbox;
