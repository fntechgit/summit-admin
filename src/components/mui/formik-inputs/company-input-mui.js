/**
 * Copyright 2020 OpenStack Foundation
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

import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useField } from "formik";
import { queryCompanies } from "../../../actions/company-actions";
import { DEBOUNCE_WAIT_250 } from "../../../utils/constants";

const filter = createFilterOptions();

const CompanyInputMUI = ({
  id,
  name,
  placeholder,
  plainValue,
  isMulti = false,
  allowCreate = false,
  ...rest
}) => {
  const [field, meta, helpers] = useField(name);
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const { value } = field;
  const error = meta.touched && meta.error;

  const fetchOptions = async (input) => {
    if (!input) {
      setOptions([]);
      return;
    }

    setIsDebouncing(false);
    setLoading(true);

    const normalize = (results) =>
      results.map((r) => ({
        value: r.id.toString(),
        label: r.name
      }));

    await queryCompanies(input, (results) => {
      setOptions(normalize(results));
      setLoading(false);
    });
  };

  useEffect(() => {
    if (inputValue) {
      setIsDebouncing(true);
      const delayDebounce = setTimeout(() => {
        fetchOptions(inputValue);
      }, DEBOUNCE_WAIT_250);
      return () => clearTimeout(delayDebounce);
    }
    setIsDebouncing(false);
  }, [inputValue]);

  const selectedValue = useMemo(() => {
    if (!value) return isMulti ? [] : null;

    if (isMulti) {
      return value.map((v) =>
        plainValue
          ? { value: v, label: v }
          : { value: v.id?.toString(), label: v.name }
      );
    }
    return plainValue
      ? { value, label: value }
      : { value: value.id?.toString(), label: value.name };
  }, [value, plainValue, isMulti]);

  const handleChange = (_, newValue) => {
    let theValue;

    if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
      theValue = isMulti ? [] : plainValue ? "" : { id: "", name: "" };
    } else if (isMulti) {
      theValue = plainValue
        ? newValue.map((v) => v.label)
        : newValue.map((v) => ({
            id: parseInt(v.value),
            name: v.label
          }));
    } else {
      theValue = plainValue
        ? newValue.inputValue || newValue.label
        : {
            id: newValue.inputValue ? 0 : parseInt(newValue.value),
            name: newValue.inputValue || newValue.label
          };
    }

    helpers.setValue(theValue);
  };

  const handleFilterOptions = (options, params) => {
    const filtered = filter(options, params);

    if (!allowCreate || loading || isDebouncing) return filtered;

    const { inputValue } = params;
    const isExisting = options.some(
      (option) => inputValue.toLowerCase() === option.label.toLowerCase()
    );

    if (inputValue !== "" && !isExisting) {
      filtered.push({
        inputValue,
        value: null,
        label: `Create "${inputValue}"`
      });
    }
    return filtered;
  };

  const getOptionLabel = (option) => {
    if (option.inputValue) {
      return option.inputValue;
    }
    return option.label || "";
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      value={selectedValue}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      filterOptions={handleFilterOptions}
      multiple={isMulti}
      onChange={handleChange}
      loading={loading}
      fullWidth
      popupIcon={<ExpandMoreIcon />}
      renderOption={(props, option) => (
        <li {...props} key={option.value ?? `create-${option.inputValue}`}>
          {option.label}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          name={field.name}
          placeholder={placeholder}
          variant="outlined"
          error={Boolean(error)}
          helperText={error || ""}
          slotProps={{
            ...params.InputProps,
            inputLabel: { shrink: false },
            sx: {
              "& input::placeholder": {
                color: "#00000061",
                opacity: 1
              }
            },
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps?.endAdornment}
              </>
            )
          }}
        />
      )}
      {...rest}
    />
  );
};

CompanyInputMUI.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  plainValue: PropTypes.bool,
  isMulti: PropTypes.bool,
  allowCreate: PropTypes.bool
};

export default CompanyInputMUI;
