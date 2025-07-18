import React from "react";
import {
  Checkbox,
  Divider,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select
} from "@mui/material";

const DropdownCheckbox = ({ name, label, allLabel, value, options, onChange }) => {
  const allIds = options.map(({ id }) => id);
  const isAllSelected = allIds.every((id) => value.includes(id));

  const handleChange = (event) => {
    const selectedValues = event.target.value;
    const responseVal = {target: {name, value: []}};

    // Handle "All" selection
    if (selectedValues.includes("all")) {
      // If "all" is selected and not yet fully selected, select all IDs
      if (!isAllSelected) {
        responseVal.target.value = allIds; // Select all options
      } else {
        responseVal.target.value = [];
      }
    } else {
      // Handle individual option selection
      responseVal.target.value = selectedValues;
    }

    onChange(responseVal);

  };


  return (
    <FormControl fullWidth>
      <InputLabel id={`${name}_label`}>
        {label}
      </InputLabel>
      <Select
        labelId={`${name}_label`}
        name={name}
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => {
          if (isAllSelected) {
            return allLabel; // Display allLabel when all options are selected
          }
          const selectedNames = options
            .filter(({ id }) => selected.includes(id))
            .map(({ name }) => name);
          return selectedNames.join(", ");
        }}
      >
        <MenuItem key="all" value="all">
          <Checkbox checked={isAllSelected} />
          <ListItemText primary={allLabel} />
        </MenuItem>
        <Divider />
        {options.map(({ name, id }) => (
          <MenuItem key={id} value={id}>
            <Checkbox checked={value.includes(id)} />
            <ListItemText primary={name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DropdownCheckbox;