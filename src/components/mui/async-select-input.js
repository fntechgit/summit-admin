import React, { useEffect, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";

const AsyncSelectInput = ({
  id,
  label,
  value,
  onChange,
  queryFunction,
  formatOption = (item) => ({ value: item.id, label: item.name })
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOptions = (input) => {
    setLoading(true);
    queryFunction(input, (results) => {
      setOptions(results.map(formatOption));
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchOptions("");
  }, []);

  return (
    <Autocomplete
      options={options}
      value={value ? { value, label: value } : null}
      loading={loading}
      fullWidth
      getOptionLabel={(option) => option.label || ""}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      onInputChange={(ev, newInput) => fetchOptions(newInput)}
      onChange={(ev, selected) =>
        onChange({ target: { id, value: selected?.value ?? "" } })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size="small"
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={16} />}
                  {params.InputProps?.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  );
};

export default AsyncSelectInput;
