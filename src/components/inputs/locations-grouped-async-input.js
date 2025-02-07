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

import React, { useState, useEffect } from "react";
import AsyncSelect from "react-select/lib/Async";
import { queryGroupLocations } from "../../actions/location-actions";

const LocationGroupedAsyncDropdown = ({
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
      const updatedValue = allOptions
        .flatMap((op) => (op.options ? op.options : op))
        .filter((op) => value.includes(op.value));
      setTheValue(updatedValue);
    } else if (!isMulti && value) {
      const foundOption = allOptions
        .flatMap((op) => (op.options ? op.options : op))
        .find((op) => op.value === value);
      if (foundOption) {
        setTheValue(foundOption);
      }
    }
  }, [allOptions, value]);

  const handleChange = (value) => {
    let newValue = null;
    const isMulti = multi || rest.isMulti;
    if (value) {
      newValue = isMulti ? value.map((v) => v.value) : value.value;
    }

    const ev = {
      target: {
        id,
        value: newValue,
        type: "groupedlocationinput"
      }
    };

    onChange(ev);
  };

  const RoomLabel = ({ room }) => (
    <span>
      {room.name}{" "}
      <i style={{ color: "gray", fontSize: "0.8em" }}>- {room.id}</i>
    </span>
  );

  const getLocations = (input, callback) => {
    // we need to map into value/label because of a bug in react-select 2
    // https://github.com/JedWatson/react-select/issues/2998

    const translateOptions = (locations) => {
      let newOptions = [];

      locations.forEach((loc) => {
        const roomsWithoutFloors =
          loc.rooms?.filter((rm) => rm.floor_id === 0) || [];

        newOptions.push({
          label: (
            <i>
              <b>All {loc.name} locations</b>
            </i>
          ),
          value: loc.id
        });
        newOptions = newOptions.concat(
          roomsWithoutFloors.map((rm) => ({
            label: <RoomLabel room={rm} />,
            value: rm.id
          }))
        );

        loc.floors?.forEach((fl) => {
          const floorRooms = loc.rooms.filter((rm) => rm.floor_id === fl.id);
          newOptions.push({
            label: fl.name,
            options: floorRooms.map((rm) => ({
              label: <RoomLabel room={rm} />,
              value: rm.id
            }))
          });
        });
      });

      if (!input) {
        setAllOptions(newOptions);
      }

      callback(newOptions);
    };

    queryGroupLocations(summitId, input, translateOptions);
  };

  const has_error = error && error !== "";

  return (
    <div>
      <AsyncSelect
        value={theValue}
        placeholder={placeholder}
        onChange={handleChange}
        loadOptions={getLocations}
        defaultOptions
        styles={{
          group: (baseStyles) => ({
            ...baseStyles,
            borderTop: "1px solid lightgray"
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            zIndex: 2000
          })
        }}
        isMulti={isMulti}
        {...rest}
      />
      {has_error && <p className="error-label">{error}</p>}
    </div>
  );
};

export default LocationGroupedAsyncDropdown;
