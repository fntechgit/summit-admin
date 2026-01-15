import React from "react";
import PropTypes from "prop-types";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { useField } from "formik";

const MuiFormikDatepicker = ({ name, label, required }) => {
  const [field, meta, helpers] = useField(name);
  const requiredLabel = `${label} *`;
  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        value={field.value}
        onChange={helpers.setValue}
        slotProps={{
          textField: {
            name,
            label: required ? requiredLabel : label,
            error: meta.touched && Boolean(meta.error),
            helperText: meta.touched && meta.error,
            fullWidth: true
          },
          day: {
            sx: {
              fontSize: "1.2rem",
              fontWeight: 600
            }
          },
          layout: {
            sx: {
              "& .MuiDayCalendar-weekDayLabel": {
                fontSize: "1rem"
              }
            }
          }
        }}
        margin="normal"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    </LocalizationProvider>
  );
};

MuiFormikDatepicker.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default MuiFormikDatepicker;
