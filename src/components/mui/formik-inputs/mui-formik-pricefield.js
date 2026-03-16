import React, { useState } from "react";
import PropTypes from "prop-types";
import { InputAdornment } from "@mui/material";
import { useField } from "formik";
import MuiFormikTextField from "./mui-formik-textfield";
import { ONE_HUNDRED } from "../../../utils/constants";

const BLOCKED_KEYS = ["e", "E", "+", "-"];

const MuiFormikPriceField = ({
  name,
  label,
  inCents = false,
  inputProps = { step: 0.01 },
  ...props
}) => {
  // eslint-disable-next-line no-unused-vars
  const [field, meta, helpers] = useField(name);
  const [cleared, setCleared] = useState(false);

  const emptyValue = meta.initialValue === null ? null : 0;

  const getDisplayValue = () => {
    if (cleared) return "";
    if (field.value == null || field.value === 0) {
      return field.value === 0 ? 0 : "";
    }
    return inCents ? field.value / ONE_HUNDRED : field.value;
  };

  const handleChange = (e) => {
    const newVal = e.target.value;

    if (newVal === "") {
      setCleared(true);
      helpers.setValue(emptyValue);
      return;
    }

    setCleared(false);
    const newPrice = Number(newVal) * ONE_HUNDRED;

    helpers.setValue(newPrice);
  };

  const handleKeyDown = (e) => {
    if (BLOCKED_KEYS.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Block "0" as first character — only 1-9 are valid leading digits.
    // When value is empty or already "0", prevent any "0" keypress.
    if (e.key === "0" && (e.target.value === "" || e.target.value === "0")) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <MuiFormikTextField
      name={name}
      label={label}
      type="number"
      value={getDisplayValue()}
      onChange={handleChange}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">$</InputAdornment>
        }
      }}
      inputProps={{
        min: 0,
        inputMode: "decimal",
        ...inputProps
      }}
      onKeyDown={handleKeyDown}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

MuiFormikPriceField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
};

export default MuiFormikPriceField;
