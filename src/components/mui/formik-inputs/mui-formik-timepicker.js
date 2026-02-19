import React from "react";
import PropTypes from "prop-types";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import { useField } from "formik";

const MuiFormikTimepicker = ({ name, minTime, maxTime, timeZone }) => {
  const [field, meta, helpers] = useField(name);

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <TimePicker
        value={field.value}
        onChange={helpers.setValue}
        minTime={minTime}
        maxTime={maxTime}
        timezone={timeZone}
        label={timeZone}
        views={["hours", "minutes"]}
        slotProps={{
          textField: {
            name,
            error: meta.touched && Boolean(meta.error),
            helperText: meta.touched && meta.error,
            size: "small",
            fullWidth: true,
            sx: {
              "& .MuiPickersSectionList-root": {
                width: "100%"
              },
              "& .MuiFormHelperText-root": {
                marginLeft: "4px",
                marginRight: "4px"
              }
            }
          }
        }}
      />
    </LocalizationProvider>
  );
};

MuiFormikTimepicker.propTypes = {
  name: PropTypes.string.isRequired
};

export default MuiFormikTimepicker;
