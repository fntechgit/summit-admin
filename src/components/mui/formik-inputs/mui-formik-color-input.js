import React from "react";
import PropTypes from "prop-types";
import { useField } from "formik";
import { MuiColorInput } from "mui-color-input";

const COLOR_INPUT_SX = {
  "& input": { visibility: "hidden" },
  "& .MuiInputBase-root": { position: "relative", overflow: "hidden" },
  "& .MuiInputAdornment-root": {
    position: "absolute",
    inset: 0,
    maxHeight: "none",
    margin: 0
  },
  "& .MuiColorInput-Button": {
    width: "100%",
    height: "100%",
    borderRadius: "3px",
    minWidth: 0
  }
};

const MuiFormikColorInput = ({ name, ...props }) => {
  const [field, , helpers] = useField(name);

  const value = field.value?.startsWith("#")
    ? field.value
    : field.value
    ? `#${field.value}`
    : "";

  return (
    <MuiColorInput
      {...props}
      value={value}
      onChange={(newColor) => helpers.setValue(newColor)}
      format="hex"
      sx={COLOR_INPUT_SX}
    />
  );
};

MuiFormikColorInput.propTypes = {
  name: PropTypes.string.isRequired
};

export default MuiFormikColorInput;
