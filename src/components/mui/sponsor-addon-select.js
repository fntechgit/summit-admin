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
import { MenuItem, Select } from "@mui/material";
import PropTypes from "prop-types";
import { querySponsorAddons } from "../../actions/sponsor-actions";

const SponsorAddonSelect = ({
  value,
  summitId,
  sponsor,
  placeholder = "Select...",
  onChange,
  inputProps = {}
}) => {
  const [options, setOptions] = useState([]);
  const sponsorshipIds = sponsor.sponsorships.map((e) => e.id);

  useEffect(() => {
    querySponsorAddons(summitId, sponsor.id, sponsorshipIds, (results) => {
      const normalized = results.map((r) => ({
        value: r.id,
        label: r.name
      }));
      setOptions(normalized);
    });
  }, []);

  const handleChange = (ev) => {
    onChange({ id: ev.target.value, name: ev.target.label });
  };

  return (
    <Select
      fullWidth
      value={value}
      onChange={handleChange}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <span style={{ color: "#aaa" }}>{placeholder}</span>;
        }
        const match = options.find((opt) => opt.value === selected);
        return match ? match.label : selected;
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...inputProps}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
};

SponsorAddonSelect.propTypes = {
  value: PropTypes.string,
  summitId: PropTypes.number.isRequired,
  sponsor: PropTypes.object.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default SponsorAddonSelect;
