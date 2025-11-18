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
  Box,
  ListSubheader,
  Divider
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PropTypes from "prop-types";
import { useField } from "formik";

const getCustomIcon = (loading) => () =>
  (
    <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
      {loading && <CircularProgress size={16} sx={{ mr: 1 }} />}
      <ExpandMoreIcon />
    </Box>
  );

const MuiFormikSelectGroup = ({
  name,
  queryFunction,
  queryParams = [],
  placeholder = "Select options",
  showSelectAll = false,
  selectAllLabel = "Select All",
  getOptionLabel = (item) => item.name,
  getOptionValue = (item) => item.id,
  getGroupId = null,
  getGroupLabel = null,
  disabled = false
}) => {
  const [field, meta, helpers] = useField(name);
  const [options, setOptions] = useState([]);
  const [groupedOptions, setGroupedOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const value = field.value || [];
  const error = meta.touched && meta.error;

  const fetchOptions = async () => {
    setLoading(true);
    try {
      await queryFunction(...queryParams, (results) => {
        setOptions(results);

        if (getGroupId && getGroupLabel) {
          // using map no avoid duplicate groups
          const groupsMap = new Map();

          results.forEach((item) => {
            const groupId = getGroupId(item);
            const groupLabel = getGroupLabel(item);

            if (!groupsMap.has(groupId)) {
              groupsMap.set(groupId, {
                id: groupId,
                label: groupLabel,
                options: []
              });
            }

            groupsMap.get(groupId).options.push(item);
          });

          setGroupedOptions(Array.from(groupsMap.values()));
        } else {
          setGroupedOptions([
            {
              id: "default",
              label: null,
              options: results
            }
          ]);
        }
        setLoading(false);
      });
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleChange = (event) => {
    const selectedValues = event.target.value;

    if (selectedValues.includes("selectAll")) {
      const allValues = options.map(getOptionValue);
      const currentValues = value.map(getOptionValue);

      if (currentValues.length === allValues.length) {
        helpers.setValue([]);
      } else {
        helpers.setValue(options);
      }
      return;
    }

    const filteredValues = selectedValues.filter((val) => val !== "selectAll");

    const selectedItems = filteredValues
      .map((val) => {
        const found = options.find((item) => getOptionValue(item) === val);
        return found;
      })
      .filter(Boolean);

    helpers.setValue(selectedItems);
  };

  const selectedValues = value.map((item) => getOptionValue(item));

  const isAllSelected = () =>
    selectedValues.length === options.length && options.length > 0;

  const renderGroupedOptions = () =>
    groupedOptions
      .map((group, groupIndex) => [
        group.label && (
          <ListSubheader
            key={`header-${group.id}`}
            sx={{
              fontWeight: 400,
              fontSize: "14px",
              color: "#00000061",
              lineHeight: "24px",
              textTransform: "uppercase",
              letterSpacing: "0.17px",
              pointerEvents: "none"
            }}
          >
            {group.label}
          </ListSubheader>
        ),
        ...group.options.map((option) => {
          const optionValue = getOptionValue(option);
          const isChecked = selectedValues.includes(optionValue);

          return (
            <MenuItem
              key={optionValue}
              value={optionValue}
              sx={{ pl: 2 }}
              onClick={() => {
                const newValues = isChecked
                  ? selectedValues.filter((v) => v !== optionValue)
                  : [...selectedValues, optionValue];
                handleChange({ target: { value: newValues } });
              }}
            >
              <Checkbox
                checked={isChecked}
                sx={{
                  p: 1,
                  "& svg": {
                    fontSize: 24
                  }
                }}
              />
              <ListItemText
                primary={getOptionLabel(option)}
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
          );
        }),
        group.label && groupIndex < groupedOptions.length - 1 && (
          <Divider key={`divider-${group.id}`} />
        )
      ])
      .flat()
      .filter(Boolean);

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
        disabled={disabled || loading}
        renderValue={(selected) => {
          if (!selected || selected.length === 0) {
            return (
              <span style={{ color: "#aaa" }}>
                {loading ? "Loading..." : placeholder}
              </span>
            );
          }
          return selected
            .map((val) => {
              const item = options.find((opt) => getOptionValue(opt) === val);
              return item ? getOptionLabel(item) : val;
            })
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
          <>
            {showSelectAll && options.length > 0 && (
              <>
                <MenuItem
                  value="selectAll"
                  sx={{
                    backgroundColor: "#fafafa",
                    "&:hover": {
                      backgroundColor: "#f0f0f0"
                    }
                  }}
                  onClick={() => {
                    // custom event value to select all
                    handleChange({ target: { value: ["selectAll"] } });
                  }}
                >
                  <Checkbox
                    checked={isAllSelected()}
                    indeterminate={
                      selectedValues.length > 0 && !isAllSelected()
                    }
                    sx={{
                      p: 1,
                      "& svg": {
                        fontSize: 24
                      }
                    }}
                  />
                  <ListItemText
                    primary={selectAllLabel}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: "16px"
                        }
                      }
                    }}
                  />
                </MenuItem>
                <Divider />
              </>
            )}
            {renderGroupedOptions()}
          </>
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

MuiFormikSelectGroup.propTypes = {
  name: PropTypes.string.isRequired,
  queryFunction: PropTypes.func.isRequired,
  queryParams: PropTypes.array,
  placeholder: PropTypes.string,
  showSelectAll: PropTypes.bool,
  selectAllLabel: PropTypes.string,
  getOptionLabel: PropTypes.func,
  getOptionValue: PropTypes.func,
  getGroupId: PropTypes.func,
  getGroupLabel: PropTypes.func,
  disabled: PropTypes.bool
};

export default MuiFormikSelectGroup;
