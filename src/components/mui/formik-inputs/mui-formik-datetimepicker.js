/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React from "react";
import PropTypes from "prop-types";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useField } from "formik";

const MuiFormikDatetimepicker = ({
  name,
  label,
  required,
  disabled = false,
  timezone,
  ...props
}) => {
  const [field, meta, helpers] = useField(name);
  const requiredLabel = `${label} *`;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DateTimePicker
        value={field.value}
        onChange={helpers.setValue}
        timezone={timezone}
        slotProps={{
          textField: {
            name,
            label: required ? requiredLabel : label,
            error: meta.touched && Boolean(meta.error),
            helperText: meta.touched && meta.error,
            fullWidth: true,
            disabled,
            size: "small"
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
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    </LocalizationProvider>
  );
};

MuiFormikDatetimepicker.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  timezone: PropTypes.string
};

export default MuiFormikDatetimepicker;
