import React, { useEffect, useState } from "react";
import { MenuItem, Select } from "@mui/material";
import PropTypes from "prop-types";
import { querySummitAddons } from "../../actions/sponsor-actions";

const SummitAddonSelect = ({
  value,
  summitId,
  placeholder = "Select...",
  onChange,
  inputProps = {}
}) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    querySummitAddons(summitId, (results) => {
      const normalized = results.map((r) => ({
        value: r,
        label: r
      }));
      setOptions(normalized);
    });
  }, []);

  const handleChange = (event) => {
    onChange(event.target.value);
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

SummitAddonSelect.propTypes = {
  value: PropTypes.string,
  summitId: PropTypes.number.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default SummitAddonSelect;
