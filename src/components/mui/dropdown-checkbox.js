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

const DropdownCheckbox = ({
  name,
  label,
  allLabel,
  value = [],
  options,
  onChange
}) => {
  const handleChange = (ev) => {
    const selected = ev.target.value;

    if (selected.includes("all")) {
      if (!value.includes("all")) {
        // if all changed from unselected to selected we remove the rest of selections
        onChange({ target: { name, value: ["all"] } });
      } else if (selected.length > 1) {
        // if all was selected and now select an item, we remove "all" from selections
        onChange({
          target: { name, value: selected.filter((v) => v !== "all") }
        });
      }
    } else {
      // else if "all" is not selected we just send selection
      onChange({ target: { name, value: selected } });
    }
  };

  return (
    <FormControl fullWidth>
      <InputLabel id={`${name}_label`}>{label}</InputLabel>
      <Select
        labelId={`${name}_label`}
        name={name}
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => {
          if (selected.includes("all")) {
            return allLabel; // Display allLabel when all options are selected
          }
          const selectedNames = options
            .filter(({ id }) => selected.includes(id))
            .map(({ name: opName }) => opName);
          return selectedNames.join(", ");
        }}
      >
        <MenuItem key="all" value="all">
          <Checkbox checked={value.includes("all")} />
          <ListItemText primary={allLabel} />
        </MenuItem>
        <Divider />
        {options.map(({ name: opName, id }) => (
          <MenuItem key={id} value={id}>
            <Checkbox checked={value.includes(id)} />
            <ListItemText primary={opName} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DropdownCheckbox;
