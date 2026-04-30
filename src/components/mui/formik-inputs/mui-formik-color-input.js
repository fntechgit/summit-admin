import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { TextField } from "@mui/material";
import { useField } from "formik";

const MuiFormikColorInput = ({ name, ...rest }) => {
  const [field, meta, helpers] = useField(name);
  const [localValue, setLocalValue] = useState(field.value || "#000000");

  useEffect(() => {
    setLocalValue(field.value || "#000000");
  }, [field.value]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = (e) => {
    helpers.setValue(e.target.value);
    helpers.setTouched(true);
  };

  return (
    <TextField
      type="color"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
      fullWidth
      sx={{
        "& input[type='color']::-webkit-color-swatch-wrapper": {
          padding: "2px"
        }
      }}
      {...rest}
    />
  );
};

MuiFormikColorInput.propTypes = {
  name: PropTypes.string.isRequired
};

export default MuiFormikColorInput;
