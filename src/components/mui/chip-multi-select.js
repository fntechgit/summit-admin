import React from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";

const ChipMultiSelect = ({ id, label, value, onChange, options, sx }) => {
  const handleDelete = (val) =>
    onChange({ target: { value: value.filter((v) => v !== val) } });

  return (
    <FormControl fullWidth size="small" sx={sx}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        multiple
        value={value}
        onChange={onChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((val) => {
              const option = options.find((o) => o.value === val);
              return option ? (
                <Chip
                  key={val}
                  label={option.label}
                  size="small"
                  onDelete={() => handleDelete(val)}
                  deleteIcon={
                    <CancelIcon onMouseDown={(ev) => ev.stopPropagation()} />
                  }
                />
              ) : null;
            })}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ChipMultiSelect;
