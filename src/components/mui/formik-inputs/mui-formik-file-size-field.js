import React, { useState } from "react";
import PropTypes from "prop-types";
import { InputAdornment } from "@mui/material";
import { useField } from "formik";
import MuiFormikTextField from "./mui-formik-textfield";
import { BYTES_PER_MB } from "../../../utils/constants";

const BLOCKED_KEYS = ["e", "E", "+", "-", ".", ","];

const bytesToMb = (bytes) => Math.floor(bytes / BYTES_PER_MB);

const MuiFormikFilesizeField = ({ name, label, ...props }) => {
  const [field, meta, helpers] = useField(name);
  const [cleared, setCleared] = useState(false);

  const emptyValue = meta.initialValue === null ? null : 0;

  const getDisplayValue = () => {
    if (cleared) return "";
    if (field.value == null || field.value === 0) {
      return field.value === 0 ? 0 : "";
    }
    return bytesToMb(field.value);
  };

  const handleChange = (e) => {
    const mbValue = e.target.value;

    if (mbValue === "") {
      setCleared(true);
      helpers.setValue(emptyValue);
      return;
    }

    setCleared(false);
    const bytes = Number(mbValue) * BYTES_PER_MB;
    helpers.setValue(bytes);
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
          endAdornment: <InputAdornment position="end">MB</InputAdornment>
        },
        htmlInput: {
          min: 0,
          inputMode: "numeric",
          step: 1
        }
      }}
      onKeyDown={handleKeyDown}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

MuiFormikFilesizeField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

export default MuiFormikFilesizeField;
