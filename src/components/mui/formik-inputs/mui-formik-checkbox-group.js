import React from "react";
import PropTypes from "prop-types";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel
} from "@mui/material";
import { useField } from "formik";
import { INT_BASE } from "../../../utils/constants";

const MuiFormikCheckboxGroup = ({ name, label, options, ...props }) => {
  const [field, meta, helpers] = useField({ name });

  // Ensure field.value is an array
  const values = Array.isArray(field.value) ? field.value : [];

  const handleChange = (ev) => {
    const { value, checked } = ev.target;

    if (checked) {
      // Add the value to the array if it's checked
      helpers.setValue([...values, parseInt(value, INT_BASE)]);
    } else {
      // Remove the value from the array if it's unchecked
      helpers.setValue(
        values.filter((val) => val !== parseInt(value, INT_BASE))
      );
    }
  };

  return (
    <FormControl
      fullWidth
      margin="normal"
      error={meta.touched && Boolean(meta.error)}
    >
      {label && <FormLabel id="checkbox-group-label">{label}</FormLabel>}
      <FormGroup aria-labelledby="checkbox-group-label" name={name} {...props}>
        {options.map((op) => (
          <FormControlLabel
            key={`chk-box-${op.value}`}
            control={
              <Checkbox
                checked={values.includes(op.value)}
                onChange={handleChange}
                value={op.value}
                sx={{ "& .MuiSvgIcon-root": { fontSize: 24 } }}
              />
            }
            label={op.label}
          />
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
