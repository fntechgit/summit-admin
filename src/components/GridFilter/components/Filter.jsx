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

import React, { useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { Box, Grid2, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PropTypes from "prop-types";
import Dropdown from "./Dropdown";
import ValueInput from "./ValueInput";
import RoundButton from "./RoundButton";
import { OPERATORS } from "../utils";

const OPERATOR_VALUES = Object.values(OPERATORS).map((op) => op.value);

const Filter = ({ id, value, criterias, onChange, onAdd, onDelete }) => {
  const criteriaOptions = criterias.map(({ key, label }) => ({
    value: key,
    label
  }));
  const criteriaObj = criterias.find(({ key }) => key === value?.criteria);
  const operatorOptions = criteriaObj?.operators || [];
  const valueSettings = criteriaObj?.values || {};

  const handleChange = (prop, val) => {
    onChange({ ...value, [prop]: val });
  };

  // auto-select the operator when only one is available for the selected criteria
  useEffect(() => {
    if (operatorOptions.length === 1 && !value?.operator) {
      handleChange("operator", operatorOptions[0].value);
    }
  }, [operatorOptions.length, value?.criteria]);

  // auto-select the value when only one option is available for the selected criteria
  useEffect(() => {
    const options = valueSettings.props?.options;
    if (options?.length === 1 && !value?.value) {
      handleChange("value", options[0].value);
    }
  }, [valueSettings.props?.options?.length, value?.criteria]);

  const isAddDisabled =
    value?.criteria == null ||
    value?.operator == null ||
    value?.value == null ||
    value?.value === "" ||
    (Array.isArray(value?.value) && value.value.length === 0);

  const handleChangeCriteria = (ev) => {
    const val = ev.target.value;
    onChange({ ...value, criteria: val, operator: null, value: null });
  };

  const handleChangeOperator = (ev) => {
    const val = ev.target.value;
    onChange({ ...value, operator: val, value: null });
  };

  const handleChangeValue = (ev) => {
    const val = ev.target.value;
    handleChange("value", val);
  };

  return (
    <Grid2 container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
      <Grid2 size={11}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Dropdown
            id={`${id}-column`}
            value={value?.criteria || ""}
            placeholder={T.translate("grid_filter.select_criteria")}
            options={criteriaOptions}
            onChange={handleChangeCriteria}
          />
          <Dropdown
            id={`${id}-operator`}
            value={value?.operator || ""}
            placeholder={T.translate("grid_filter.select_operator")}
            options={operatorOptions}
            disabled={!value?.criteria}
            onChange={handleChangeOperator}
          />
          <ValueInput
            id={`${id}-value`}
            value={value?.value || ""}
            type={valueSettings.type}
            placeholder={T.translate("grid_filter.select_values")}
            disabled={!value?.criteria}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...valueSettings.props}
            onChange={handleChangeValue}
          />
        </Box>
      </Grid2>
      <Grid2 size={1}>
        {value?.id !== "new" ? (
          <IconButton
            aria-label="delete-filter"
            onClick={() => onDelete(value)}
            size="large"
          >
            <DeleteIcon fontSize="large" />
          </IconButton>
        ) : (
          <RoundButton
            variant="contained"
            aria-label="add-filter"
            onClick={() => onAdd()}
            disabled={isAddDisabled}
            sx={{ ml: "4px" }}
          >
            <AddIcon fontSize="large" />
          </RoundButton>
        )}
      </Grid2>
    </Grid2>
  );
};

Filter.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.shape({
    id: PropTypes.string,
    criteria: PropTypes.string,
    operator: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
      PropTypes.array
    ])
  }),
  criterias: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      operators: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.oneOf(OPERATOR_VALUES).isRequired,
          label: PropTypes.string.isRequired
        })
      ),
      values: PropTypes.shape({
        type: PropTypes.string.isRequired,
        props: PropTypes.object.isRequired
      })
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

Filter.defaultProps = {
  value: null
};

export default Filter;
