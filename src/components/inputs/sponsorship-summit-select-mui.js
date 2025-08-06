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

import React, { useState, useEffect, useMemo } from "react";
import {
  MenuItem,
  Checkbox,
  ListItemText,
  CircularProgress,
  Select,
  OutlinedInput,
  Box
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PropTypes from "prop-types";
import { useField } from "formik";
import { querySponsorshipsBySummit } from "../../actions/sponsorship-actions";

const getCustomIcon = (loading) => {
  const Icon = () => (
    <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
      {loading && <CircularProgress size={16} sx={{ mr: 1 }} />}
      <ExpandMoreIcon />
    </Box>
  );
  return Icon;
};
const SponsorshipsBySummitSelectMUI = ({
  name,
  summitId,
  placeholder,
  plainValue
}) => {
  const [field, meta, helpers] = useField(name);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const value = field.value || [];
  const error = meta.touched && meta.error;

  const fetchOptions = async () => {
    setLoading(true);
    await querySponsorshipsBySummit("", summitId, (results) => {
      const normalized = results.map((r) => ({
        value: r.id.toString(),
        label: r.type.name
      }));
      setOptions(normalized);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleChange = (event) => {
    const selected = event.target.value;
    const selectedItems = plainValue
      ? selected
      : selected.map((id) => {
          const match = options.find((o) => o.value === id);
          return { id: parseInt(match.value), name: match.label };
        });

    helpers.setValue(selectedItems);
  };

  const selectedValues = plainValue
    ? value
    : value.map((v) => v.id?.toString());

  const IconWithLoading = useMemo(() => getCustomIcon(loading), [loading]);

  return (
    <>
      <Select
        multiple
        fullWidth
        value={selectedValues}
        onChange={handleChange}
        input={<OutlinedInput />}
        displayEmpty
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <span style={{ color: "#aaa" }}>{placeholder}</span>;
          }
          return options
            .filter((opt) => selected.includes(opt.value))
            .map((opt) => opt.label)
            .join(", ");
        }}
        error={Boolean(error)}
        IconComponent={IconWithLoading}
      >
        {loading ? (
          <MenuItem disabled>
            <CircularProgress size={20} />
          </MenuItem>
        ) : (
          options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox
                checked={selectedValues.includes(option.value)}
                sx={{
                  p: 1,
                  "& svg": {
                    fontSize: 24
                  }
                }}
              />
              <ListItemText
                primary={option.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "16px",
                      fontStyle: "normal",
                      fontWeight: 400,
                      lineHeight: "150%",
                      letterSpacing: "0.15px"
                    }
                  }
                }}
              />
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

SponsorshipsBySummitSelectMUI.propTypes = {
  name: PropTypes.string.isRequired,
  summitId: PropTypes.number.isRequired,
  placeholder: PropTypes.string,
  plainValue: PropTypes.bool
};

export default SponsorshipsBySummitSelectMUI;
