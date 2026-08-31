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

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { queryTemplates } from "../../actions/email-actions";

const EmailTemplateInput = ({
  id,
  value,
  onChange,
  ownerId,
  placeholder,
  error,
  plainValue,
  defaultOptions
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOptions = (input) => {
    setLoading(true);
    queryTemplates(input, (templates) => {
      const filtered = ownerId
        ? templates.filter((t) => t.id !== ownerId)
        : templates;
      setOptions(
        filtered.map((t) => ({ value: t.id.toString(), label: t.identifier }))
      );
      setLoading(false);
    });
  };

  useEffect(() => {
    if (defaultOptions) fetchOptions("");
  }, []);

  const handleInputChange = (ev, input) => {
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
      : { value: value.id.toString(), label: value.identifier };
  }

  // the selected value is a past search result that may not be part of the
  // current (freshly fetched) options list -- pin it in so Autocomplete
  // always finds a match and doesn't warn about an "invalid" controlled value
  const displayOptions =
    selectedOption && !options.some((o) => o.value === selectedOption.value)
      ? [selectedOption, ...options]
      : options;

  return (
    <Autocomplete
      id={id}
      fullWidth
      size="small"
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
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onChange: PropTypes.func.isRequired,
  ownerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  error: PropTypes.string,
  plainValue: PropTypes.bool,
  defaultOptions: PropTypes.bool
};

EmailTemplateInput.defaultProps = {
  value: null,
  ownerId: null,
  placeholder: "",
  error: "",
  plainValue: false,
  defaultOptions: false
};

export default EmailTemplateInput;
