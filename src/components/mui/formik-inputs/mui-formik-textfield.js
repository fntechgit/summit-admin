import React from "react";
import PropTypes from "prop-types";
import { Box, TextField, Typography } from "@mui/material";
import { useField } from "formik";

const MuiFormikTextField = ({
  name,
  label,
  maxLength,
  required = false,
  ...props
}) => {
  const [field, meta] = useField(name);
  const currentLength = field.value?.length || 0;

  let finalLabel = "";

  if (label) {
    finalLabel = required ? `${label} *` : label;
  }

  return (
    <Box>
      <TextField
        name={name}
        label={finalLabel}
        {...field}
        onBlur={field.onBlur}
        margin="normal"
        error={meta.touched && Boolean(meta.error)}
        helperText={meta.touched && meta.error}
        slotProps={{
          htmlInput: {
            maxLength
          }
        }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
      {maxLength && (
        <Typography sx={{ fontSize: "1.2rem", color: "#00000099", pl: 2 }}>
          {`${maxLength - currentLength} characters left`}
        </Typography>
      )}
    </Box>
  );
};

MuiFormikTextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  maxLength: PropTypes.number,
  required: PropTypes.bool
};

export default MuiFormikTextField;
