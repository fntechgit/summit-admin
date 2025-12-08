import React, { useState, useEffect } from "react";
import {
  Autocomplete,
  TextField,
  Checkbox,
  CircularProgress
} from "@mui/material";
import { useField } from "formik";
import { DEBOUNCE_WAIT_250 } from "../../../utils/constants";

const MuiFormikAsyncAutocomplete = ({
  name,
  queryFunction,
  multiple = false,
  placeholder = "Select...",
  plainValue = false,
  hiddenOptions = [],
  formatOption = (item) => ({ value: item.id.toString(), label: item.name }),
  formatSelectedValue = null,
  queryParams = [],
  isMulti = false
}) => {
  const [field, meta, helpers] = useField(name);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const value = field.value || (multiple ? [] : null);
  const error = meta.touched && meta.error;

  const fetchOptions = async (input = "") => {
    setLoading(true);
    try {
      await queryFunction(input, ...queryParams, (results) => {
        const normalized = results
          .filter((r) => !hiddenOptions.includes(r.id))
          .map(formatOption);
        setOptions(normalized);
        setLoading(false);
      });
    } catch (err) {
      console.error("Error fetching options:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const delayDebounce = setTimeout(() => {
        fetchOptions(searchTerm);
      }, DEBOUNCE_WAIT_250);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchTerm]);

  // precargar con vacío
  useEffect(() => {
    fetchOptions("");
  }, []);

  const handleChange = (event, selected) => {
    if (!multiple) {
      const selectedValue = plainValue ? selected?.value || "" : selected;
      helpers.setValue(selectedValue);
      return;
    }

    const selectedItems = plainValue
      ? selected.map((s) => s.value)
      : selected.map((s) =>
          formatSelectedValue
            ? formatSelectedValue(s)
            : { id: parseInt(s.value), name: s.label }
        );

    helpers.setValue(selectedItems);
  };

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={handleChange}
      loading={loading}
      multiple={isMulti}
      fullWidth
      getOptionLabel={(option) => option.label || ""}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      onInputChange={(e, newInput) => setSearchTerm(newInput)}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          error={Boolean(error)}
          helperText={error || ""}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps?.endAdornment}
                </>
              )
            },
            inputLabel: { shrink: false }
          }}
          sx={{
            "& input::placeholder": {
              color: "#00000061",
              opacity: 1
            }
          }}
        />
      )}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          {multiple && <Checkbox checked={selected} sx={{ mr: 1 }} />}
          {option.label}
        </li>
      )}
    />
  );
};

export default MuiFormikAsyncAutocomplete;
