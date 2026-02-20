import React from "react";
import {
  FormControl,
  ListItemText,
  MenuItem,
  Radio,
  Select
} from "@mui/material";
import { useField } from "formik";
import T from "i18n-react/dist/i18n-react";

const MuiFormikDropdownRadio = ({ name, options, placeholder, ...rest }) => {
  const finalPlaceholder = placeholder || T.translate("general.select_an_option");
  const [field, meta, helpers] = useField(name);

  const handleChange = (event) => {
    helpers.setValue(event.target.value);
  };

  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
      <Select
        variant="outlined"
        name={name}
        value={field.value || ""}
        onChange={handleChange}
        displayEmpty
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
        renderValue={(selected) => {
          if (!selected) {
            return <em>{finalPlaceholder}</em>;
          }
          const selectedOption = options.find(
            ({ value }) => value === selected
          );
          return selectedOption ? selectedOption.label : "";
        }}
      >
        {options.map(({ label, value }) => (
          <MenuItem key={`radio-ddl-${value}`} value={value}>
            <Radio checked={field.value === value} />
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MuiFormikDropdownRadio;
