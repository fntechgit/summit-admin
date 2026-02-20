import React from "react";
import {
  Checkbox,
  Divider,
  FormControl,
  ListItemText,
  MenuItem,
  Select
} from "@mui/material";
import { useField } from "formik";
import T from "i18n-react/dist/i18n-react";

const MuiFormikDropdownCheckbox = ({ name, options, ...rest }) => {
  const [field, meta, helpers] = useField(name);
  const allSelected = options.every(({ value }) =>
    field.value?.includes(value)
  );

  const handleChange = (event) => {
    const { value } = event.target;

    // If "all" was clicked
    if (value.includes("all")) {
      if (allSelected) {
        helpers.setValue([]);
      } else {
        helpers.setValue(options.map((opt) => opt.value));
      }
    } else {
      helpers.setValue(value);
    }
  };

  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
      <Select
        variant="outlined"
        name={name}
        multiple
        value={field.value || []}
        onChange={handleChange}
        onBlur={field.onBlur}
        displayEmpty
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
        renderValue={(selected) => {
          if (!selected?.length) {
            return rest.placeholder || "";
          }
          if (allSelected) {
            return T.translate("general.all");
          }
          const selectedNames = options
            .filter(({ value }) => selected?.includes(value))
            .map(({ label }) => label);
          return selectedNames.join(", ");
        }}
      >
        <MenuItem key="all" value="all">
          <Checkbox checked={allSelected} />
          <ListItemText primary={T.translate("general.all")} />
        </MenuItem>
        <Divider />
        {options.map(({ label, value }) => (
          <MenuItem key={`ckbx-ddl-${value}`} value={value}>
            <Checkbox checked={field.value?.includes(value)} />
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MuiFormikDropdownCheckbox;
