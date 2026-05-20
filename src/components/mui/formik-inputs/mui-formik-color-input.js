import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { TextField } from "@mui/material";
import { useField } from "formik";

const MuiFormikColorInput = ({ name, ...rest }) => {
  const [field, meta, helpers] = useField(name);
  const [localValue, setLocalValue] = useState(field.value || "#000000");
  const isDirtyRef = useRef(false);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
    isDirtyRef.current = true;
    helpers.setValue(e.target.value);
  };

  const handleBlur = (e) => {
    field.onBlur(e);
    helpers.setTouched(true);
    if (isDirtyRef.current) {
      helpers.setValue(localValue);
      isDirtyRef.current = false;
    }
  };

  return (
    <TextField
      type="color"
      name={field.name}
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
