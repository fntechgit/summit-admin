import React from "react";
import PropTypes from "prop-types";
import { Box, TextField, Typography } from "@mui/material";
import { useField } from "formik";

const MuiFormikTextField = ({ name, label, maxLength, ...props }) => {
  const [field, meta] = useField(name);
  const currentLength = field.value?.length || 0;

  return (
    <Box>
      <TextField
        name={name}
        label={label}
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
  label: PropTypes.string.isRequired,
  maxLength: PropTypes.number
};

export default MuiFormikTextField;
