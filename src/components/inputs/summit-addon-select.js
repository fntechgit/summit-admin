import React, { useState, useEffect, useMemo } from "react";
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

const SummitAddonSelect = ({
  name,
  summitId,
  placeholder = "Select...",
  hiddenOptions = []
}) => {
  const [field, meta, helpers] = useField(name);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const value = field.value || "";
  const error = meta.touched && meta.error;

  const fetchOptions = async () => {
    setLoading(true);
    await querySummitAddons("", summitId, (results) => {
      const normalized = results
        .filter((r) => !hiddenOptions.includes(r))
        .map((r) => ({
          value: r,
          label: r
        }));
      setOptions(normalized);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchOptions();
  }, []);

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
        error={Boolean(error)}
        renderValue={(selected) => {
          if (!selected) {
            return <span style={{ color: "#aaa" }}>{placeholder}</span>;
          }
          return options.find((opt) => opt.value === selected)?.label || "";
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
  placeholder: PropTypes.string,
  hiddenOptions: PropTypes.array
};

export default SummitAddonSelect;
