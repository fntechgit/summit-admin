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
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import { querySponsorships } from "../../actions/sponsorship-actions";
import { DEBOUNCE_WAIT_250 } from "../../utils/constants";

const SponsorshipTypeInputMUI = ({
  id,
  name,
  value,
  placeholder,
  error,
  plainValue,
  onChange,
  ...rest
}) => {
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const hasError = !!error;

  const fetchOptions = async (input) => {
    if (!input) {
      setOptions([]);
      return;
    }

    setLoading(true);

    const normalize = (results) =>
      results.map((r) => ({
        value: r.id.toString(),
        label: r.name
      }));

    await querySponsorships(input, (results) => {
      setOptions(normalize(results));
      setLoading(false);
    });
  };

  useEffect(() => {
    if (inputValue) {
      const delayDebounce = setTimeout(() => {
        fetchOptions(inputValue);
      }, DEBOUNCE_WAIT_250);
      return () => clearTimeout(delayDebounce);
    }
  }, [inputValue]);

  const selectedValue = useMemo(() => {
    if (!value) return null;
    return plainValue
      ? { value, label: value }
      : { value: value.id?.toString(), label: value.name };
  }, [value, plainValue]);

  const handleChange = (_, newValue) => {
    let theValue;
    if (!newValue) {
      theValue = plainValue ? "" : { id: "", name: "" };
    } else {
      theValue = plainValue
        ? newValue.label
        : { id: parseInt(newValue.value), name: newValue.label };
    }

    onChange({
      target: {
        id,
        name,
        value: theValue,
        type: "sponsorshipinput"
      }
    });
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      value={selectedValue}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={handleChange}
      loading={loading}
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          error={hasError}
          helperText={hasError ? error : ""}
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

export default SponsorshipTypeInputMUI;
