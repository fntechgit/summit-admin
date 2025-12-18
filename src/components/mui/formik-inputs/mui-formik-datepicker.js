import React from "react";
import PropTypes from "prop-types";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { useField } from "formik";

const MuiFormikDatepicker = ({ name, label }) => {
  const [field, meta, helpers] = useField(name);
  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        value={field.value}
        onChange={helpers.setValue}
        slotProps={{
          textField: {
            name,
            label,
            error: meta.touched && Boolean(meta.error),
            helperText: meta.touched && meta.error,
            fullWidth: true,
            margin: "normal"
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
      />
    </LocalizationProvider>
  );
};

MuiFormikDatepicker.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

export default MuiFormikDatepicker;
