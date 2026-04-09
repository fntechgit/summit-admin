import React, { useState } from "react";
import PropTypes from "prop-types";
import { InputAdornment } from "@mui/material";
import { useField } from "formik";
import MuiFormikTextField from "./mui-formik-textfield";
import { DECIMAL_DIGITS, ONE_HUNDRED } from "../../../utils/constants";

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
  const [isFocused, setIsFocused] = useState(false);
  const [focusedValue, setFocusedValue] = useState("");

  // emptyValue is always 0 when editing this field, null is handled by N/A checkbox
  const emptyValue = 0;

  const getRawString = () => {
    if (cleared || field.value == null) return "";
    if (field.value === 0) return "0";
    const raw = inCents ? field.value / ONE_HUNDRED : field.value;
    return String(Number(raw.toFixed(DECIMAL_DIGITS)));
  };

  const getDisplayValue = () => {
    if (isFocused) return focusedValue;
    if (cleared) return "";
    if (field.value == null || field.value === 0) {
      return field.value === 0 ? 0 : "";
    }
    const str = getRawString();
    const dotIdx = str.indexOf(".");
    if (dotIdx === -1) return `${str}.00`;
    if (str.length - dotIdx - 1 === 1) return `${str}0`;
    return str;
  };

  const handleFocus = () => {
    setIsFocused(true);
    setFocusedValue(getRawString());
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    field.onBlur(e);
    if (props.onBlur) props.onBlur(e);
  };

  const handleChange = (e) => {
    const newVal = e.target.value;
    setFocusedValue(newVal);

    if (newVal === "") {
      setCleared(true);
      helpers.setValue(emptyValue);
      return;
    }

    setCleared(false);
    const numericValue = Number(newVal);
    const newPrice = inCents
      ? Math.round(numericValue * ONE_HUNDRED)
      : numericValue;

    helpers.setValue(newPrice);
  };

  const handleKeyDown = (e) => {
    if (BLOCKED_KEYS.includes(e.key)) {
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
      onFocus={handleFocus}
      onBlur={handleBlur}
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
