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

import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { queryTemplates } from "../../actions/email-actions";

const EmailTemplateInput = ({
  id,
  name,
  value,
  onChange,
  ownerId,
  placeholder,
  error,
  plainValue,
  defaultOptions,
  isClearable,
  cacheOptions
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const optionsCacheRef = useRef(new Map());

  const fetchOptions = (input) => {
    if (cacheOptions && optionsCacheRef.current.has(input)) {
      setOptions(optionsCacheRef.current.get(input));
      return;
    }

    setLoading(true);
    queryTemplates(input, (templates) => {
      const filtered = ownerId
        ? templates.filter((t) => t.id !== ownerId)
        : templates;
      const mappedOptions = filtered.map((t) => ({
        value: plainValue ? t.identifier : t.id.toString(),
        label: t.identifier
      }));
      if (cacheOptions) optionsCacheRef.current.set(input, mappedOptions);
      setOptions(mappedOptions);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (defaultOptions) fetchOptions("");
  }, []);

  const handleInputChange = (ev, input, reason) => {
    // Autocomplete also fires this for "selectOption"/"reset" (the input text
    // set programmatically) -- only a real keystroke or a clear should re-search.
    if (reason !== "input" && reason !== "clear") return;

    if (!input && !defaultOptions) {
      setOptions([]);
      return;
    }
    fetchOptions(input);
  };

  const handleChange = (ev, newValue) => {
    let theValue;

    if (!newValue) {
      theValue = plainValue ? "" : { id: "", identifier: "" };
    } else {
      theValue = plainValue
        ? newValue.label
        : { id: newValue.value, identifier: newValue.label };
    }

    onChange({ target: { id, value: theValue, type: "emailtemplateinput" } });
  };

  let selectedOption = null;
  if (value) {
    selectedOption = plainValue
      ? { value, label: value }
      : { value: String(value.id ?? ""), label: value.identifier ?? "" };
  }

  // the selected value may not be in the freshly-fetched options list --
  // pin it in so Autocomplete doesn't warn about an "invalid" controlled value
  const displayOptions =
    selectedOption && !options.some((o) => o.value === selectedOption.value)
      ? [selectedOption, ...options]
      : options;

  return (
    <Autocomplete
      id={id}
      fullWidth
      size="small"
      disableClearable={!isClearable}
      options={displayOptions}
      loading={loading}
      value={selectedOption}
      isOptionEqualToValue={(option, selected) =>
        option.value === selected.value
      }
      getOptionLabel={(option) => option.label || ""}
      onChange={handleChange}
      onInputChange={handleInputChange}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          placeholder={placeholder}
          error={!!error}
          helperText={error || undefined}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  );
};

EmailTemplateInput.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onChange: PropTypes.func.isRequired,
  ownerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  error: PropTypes.string,
  plainValue: PropTypes.bool,
  defaultOptions: PropTypes.bool,
  isClearable: PropTypes.bool,
  cacheOptions: PropTypes.bool
};

EmailTemplateInput.defaultProps = {
  name: undefined,
  value: null,
  ownerId: null,
  placeholder: "",
  error: "",
  plainValue: false,
  defaultOptions: false,
  isClearable: false,
  cacheOptions: false
};

export default EmailTemplateInput;
