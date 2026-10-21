/**
 * Copyright 2026 OpenStack Foundation
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
import { Autocomplete, TextField } from "@mui/material";
import { useField } from "formik";
import { queryTags } from "openstack-uicore-foundation/lib/utils/query-actions";

// creatable: a typed tag that doesn't exist yet is saved as { tag } and created by the API
const TagsInput = ({ name, placeholder }) => {
  const [field, , helpers] = useField(name);
  const [options, setOptions] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    queryTags(null, input, setOptions);
  }, [input]);

  const handleChange = (_ev, selected) => {
    helpers.setValue(
      selected.map((s) => (typeof s === "string" ? { tag: s.trim() } : s))
    );
  };

  return (
    <Autocomplete
      id={name}
      multiple
      freeSolo
      options={options}
      value={field.value}
      onChange={handleChange}
      onInputChange={(_ev, value) => setInput(value)}
      getOptionLabel={(option) => option.tag ?? option}
      isOptionEqualToValue={(option, value) => option.tag === value.tag}
      renderInput={(params) => (
        <TextField {...params} name={name} placeholder={placeholder} />
      )}
    />
  );
};

export default TagsInput;
