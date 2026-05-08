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

import React from "react";
import { Button, Grid2 } from "react-bootstrap";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Dropdown from "./Dropdown";
import ValueInput from "./ValueInput";

const Filter = ({
  id,
  value,
  criteria,
  criteriaOptions,
  onChange,
  onAdd,
  onDelete
}) => {
  const criteriaSettings = { options: criteriaOptions };
  const operatorSettings = criteria.operators;
  const valueSettings = criteria.values;

  const handleChange = (prop, val) => {
    onChange({ ...value, [prop]: val });
  };

  return (
    <Grid2 container spacing={2} sx={{ alignItems: "center" }}>
      <Grid2 size={11}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Dropdown
            id={`${id}-column`}
            value={value.criteria}
            placeholder={T.translate("grid_filter.select_criteria")}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...criteriaSettings}
            onChange={(val) => handleChange("criteria", val)}
          />
          <Dropdown
            id={`${id}-operator`}
            value={value.operator}
            placeholder={T.translate("grid_filter.select_operator")}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...operatorSettings}
            onChange={(val) => handleChange("operator", val)}
          />
          <ValueInput
            id={`${id}-value`}
            value={value.value}
            type={valueSettings.type}
            placeholder={T.translate("grid_filter.select_values")}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...valueSettings.props}
            onChange={(val) => handleChange("value", val)}
          />
        </Box>
      </Grid2>
      <Grid2 size={1}>
        <Button
          variant="outlined"
          aria-label="delete"
          onClick={() => onDelete(id)}
        >
          <DeleteIcon />
        </Button>
        <Button variant="contained" aria-label="add" onClick={onAdd}>
          <AddIcon />
        </Button>
      </Grid2>
    </Grid2>
  );
};

Filter.propTypes = {
  id: PropTypes.string,
  value: PropTypes.shape({
    criteria: PropTypes.string,
    operator: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
      PropTypes.array
    ])
  }),
  criteriaSettings: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string
      })
    ).isRequired,
    placeholder: PropTypes.string
  }).isRequired,
  operatorSettings: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string
      })
    ).isRequired,
    placeholder: PropTypes.string
  }).isRequired,
  valueSettings: PropTypes.shape({
    type: PropTypes.string, // class name of the component to render the value
    props: PropTypes.object // props to pass to the component
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

Filter.defaultProps = {
  value: null
};

export default Filter;
