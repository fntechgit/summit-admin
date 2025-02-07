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
import { queryBookableRooms } from "../../actions/location-actions";

const BookableRoomsDropdown = ({
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
  const [allOptionsWithData, setAllOptionsWithData] = useState([]);

  const isMulti = multi || rest.isMulti;

  useEffect(() => {
    if (isMulti && value.length > 0) {
      const updatedValue = [];
      allOptions.forEach((op) => {
        if (value.includes((v) => v === op.value)) {
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
  }, [allOptions]);

  const handleChange = (value) => {
    let theValue = null;
    let roomData = null;
    if (value) {
      theValue = isMulti
        ? value.map((v) => ({ id: v.value, value: v.label }))
        : { id: value.value, value: value.label };
      roomData = isMulti
        ? allOptionsWithData.filter((opt) =>
            value.some((v) => v.value === opt.id)
          )
        : allOptionsWithData.find((opt) => opt.id === value.value);
    }

    const ev = {
      target: {
        id,
        value: theValue,
        type: "bookableroominput",
        room: roomData
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

      if (!allOptions.length && !input) {
        setAllOptions(newOptions);
        setAllOptionsWithData(locations);
      }

      callback(newOptions);
    };

    queryBookableRooms(summitId, input, translateOptions);
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
        isMulti={isMulti}
        styles={{
          menu: (baseStyles) => ({
            ...baseStyles,
            zIndex: 2000
          })
        }}
        {...rest}
      />
      {has_error && <p className="error-label">{error}</p>}
    </div>
  );
};

export default BookableRoomsDropdown;
