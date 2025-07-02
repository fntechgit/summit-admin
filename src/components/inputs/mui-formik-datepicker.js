import React from "react";
import PropTypes from "prop-types";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

const MuiFormikDatepicker = ({ name, label, formik }) => {
  const { errors, values, touched, setFieldValue } = formik;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        value={values[name]}
        onChange={(value) => setFieldValue(name, value, true)}
        slotProps={{
          textField: {
            name,
            fullWidth: true,
            margin: "normal",
            label,
            error: touched[name] && Boolean(errors[name]),
            helperText: touched[name] && errors[name]
          }
        }}
      />
    </LocalizationProvider>
  );
};

MuiFormikDatepicker.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired
};

export default MuiFormikDatepicker;
