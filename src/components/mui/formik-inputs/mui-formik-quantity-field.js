import React from "react";
import PropTypes from "prop-types";
import MuiFormikTextField from "./mui-formik-textfield";

const BLOCKED_KEYS = ["e", "E", "+", "-"];

const MuiFormikQuantityField = ({ ...props }) => (
  <MuiFormikTextField
    type="number"
    onKeyDown={(e) => {
      if (BLOCKED_KEYS.includes(e.key)) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
      }
    }}
    inputProps={{
      min: 0,
      inputMode: "decimal"
    }}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  />
);

MuiFormikQuantityField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
};

export default MuiFormikQuantityField;
