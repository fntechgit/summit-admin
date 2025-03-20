/**
 * Copyright 2017 OpenStack Foundation
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
import AsyncSelect from "react-select/lib/Async";
import { queryAllRooms } from "../../actions/location-actions";

const RoomsInput = ({
  summitId,
  placeholder,
  error,
  value,
  onChange,
  id,
  multi,
  ...rest
}) => {
  const [theValue, setTheValue] = useState(null);
  const [allOptions, setAllOptions] = useState([]);

  const isMulti = multi || rest.isMulti;

  useEffect(() => {
    if (isMulti) {
      const updatedValue = [];
      allOptions.forEach((op) => {
        if (value.includes(op.value)) {
          updatedValue.push(op);
        }
      });
      setTheValue(updatedValue);
    } else if (!isMulti && value) {
      allOptions.forEach((op) => {
        if (op.value === value) {
          setTheValue(op);
        }
      });
    }
  }, [allOptions, value]);

  const handleChange = (value) => {
    let theValue = null;

    if (value) {
      theValue = isMulti
        ? value.map((v) => v.value)
        : { id: value.value, name: value.label };
    }

    const ev = {
      target: {
        id,
        value: theValue,
        type: "roominput"
      }
    };

    onChange(ev);
  };

  const getRooms = (input, callback) => {
    // we need to map into value/label because of a bug in react-select 2
    // https://github.com/JedWatson/react-select/issues/2998

    const translateOptions = (locations) => {
      const newOptions = locations.map((c) => ({
        value: c.id,
        label: c.name
      }));

      if (!input) {
        setAllOptions(newOptions);
      }

      callback(newOptions);
    };

    queryAllRooms(summitId, input, translateOptions);
  };

  const has_error = error && error !== "";

  return (
    <div>
      <AsyncSelect
        value={theValue}
        placeholder={placeholder}
        onChange={handleChange}
        loadOptions={getRooms}
        defaultOptions
        styles={{
          menu: (baseStyles) => ({
            ...baseStyles,
            zIndex: 2000
          })
        }}
        isMulti
        {...rest}
      />
      {has_error && <p className="error-label">{error}</p>}
    </div>
  );
};

export default RoomsInput;
