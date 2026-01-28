import React from "react";
import PropTypes from "prop-types";
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup
} from "@mui/material";
import { useField } from "formik";

const MuiFormikRadioGroup = ({
  name,
  label,
  marginWrapper = "normal",
  options,
  ...props
}) => {
  const [field, meta] = useField({ name });

  return (
    <FormControl
      fullWidth
      margin={marginWrapper}
      error={meta.touched && Boolean(meta.error)}
    >
      {label && <FormLabel id="radio-group-label">{label}</FormLabel>}
      <RadioGroup
        aria-labelledby="radio-group-label"
        defaultValue={field.value}
        name={name}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...field}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      >
        {options.map((op) => (
          <FormControlLabel
            key={`radio-box-${op.value}`}
            value={op.value}
            control={
              <Radio
                sx={{
                  "& .MuiSvgIcon-root": {
                    fontSize: 24
                  }
                }}
              />
            }
            label={op.label}
          />
        ))}
      </RadioGroup>
      {meta.touched && meta.error && (
        <FormHelperText>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
};

MuiFormikRadioGroup.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  marginWrapper: PropTypes.string,
  options: PropTypes.array.isRequired
};

export default MuiFormikRadioGroup;
