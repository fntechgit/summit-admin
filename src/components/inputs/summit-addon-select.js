import React, { useState, useMemo } from "react";
import { MenuItem, CircularProgress, Select, Box } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PropTypes from "prop-types";
import { useField } from "formik";
import { querySummitAddons } from "../../actions/sponsor-actions";

const getCustomIcon = (loading) => {
  const Icon = () => (
    <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
      {loading && <CircularProgress size={16} sx={{ mr: 1 }} />}
      <ExpandMoreIcon />
    </Box>
  );
  return Icon;
};

const SummitAddonSelect = ({ name, summitId, placeholder = "Select..." }) => {
  const [field, meta, helpers] = useField(name);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasOptions, setHasOptions] = useState(false);

  const value = field.value || "";
  const error = meta.touched && meta.error;

  const fetchOptions = async () => {
    if (hasOptions || loading) return;

    setLoading(true);
    await querySummitAddons("", summitId, (results) => {
      const normalized = results.map((r) => ({
        value: r,
        label: r
      }));
      setOptions(normalized);
      setHasOptions(true);
      setLoading(false);
    });
  };

  const handleChange = (event) => {
    helpers.setValue(event.target.value);
  };

  const IconWithLoading = useMemo(() => getCustomIcon(loading), [loading]);

  return (
    <>
      <Select
        fullWidth
        value={value}
        onChange={handleChange}
        displayEmpty
        IconComponent={IconWithLoading}
        onOpen={fetchOptions}
        error={Boolean(error)}
        renderValue={(selected) => {
          if (!selected) {
            return <span style={{ color: "#aaa" }}>{placeholder}</span>;
          }
          const match = options.find((opt) => opt.value === selected);
          return match ? match.label : selected;
        }}
      >
        {loading ? (
          <MenuItem disabled>
            <CircularProgress size={20} />
          </MenuItem>
        ) : (
          options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))
        )}
      </Select>
      {error && (
        <div
          style={{
            color: "#d32f2f",
            fontSize: "0.75rem",
            marginTop: "3px"
          }}
        >
          {error}
        </div>
      )}
    </>
  );
};

SummitAddonSelect.propTypes = {
  name: PropTypes.string.isRequired,
  summitId: PropTypes.number.isRequired,
  placeholder: PropTypes.string
};

export default SummitAddonSelect;
