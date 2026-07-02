import React, { useState } from "react";
import PropTypes from "prop-types";
import { useField } from "formik";
import { MuiColorInput } from "mui-color-input";

// MuiColorInput fires onChange on every pointermove while dragging the color
// panel, so the picked value is kept in local state for instant visual
// feedback and only committed to Formik (value + touched + validation) on
// blur or Enter - committing on every drag frame would re-render the whole
// dialog. The Enter commit is required because implicit form submission
// (Enter inside a form with a submit button) dispatches submit without ever
// blurring the input, which would otherwise submit the stale Formik value.
const MuiFormikColorField = ({ name, ...props }) => {
  const [field, meta, helpers] = useField(name);
  const [value, setValue] = useState(field.value || "");

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  const handleBlur = (ev) => {
    field.onBlur(ev);
    helpers.setValue(value);
  };

  const handleKeyDown = (ev) => {
    if (ev.key === "Enter") {
      helpers.setValue(value);
    }
  };

  const error = meta.touched ? meta.error : "";

  return (
    <MuiColorInput
      name={name}
      id={name}
      value={value}
      format="hex"
      margin="none"
      fullWidth
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      error={!!error}
      helperText={error || undefined}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

MuiFormikColorField.propTypes = {
  name: PropTypes.string.isRequired
};

export default MuiFormikColorField;
