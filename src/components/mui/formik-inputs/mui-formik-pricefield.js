import React from "react";
import PropTypes from "prop-types";
import { InputAdornment } from "@mui/material";
import MuiFormikTextField from "./mui-formik-textfield";

const MuiFormikPriceField = ({ name, label, ...props }) => (
  <MuiFormikTextField
    name={name}
    label={label}
    type="number"
    slotProps={{
      input: {
        startAdornment: <InputAdornment position="start">$</InputAdornment>
      }
    }}
    inputProps={{
      min: 0,
      inputMode: "decimal",
      step: 0.01
    }}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  />
);

MuiFormikPriceField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

export default MuiFormikPriceField;
