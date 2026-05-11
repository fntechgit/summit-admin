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
import T from "i18n-react/dist/i18n-react";
import { Grid2, Button, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PropTypes from "prop-types";
import Dropdown from "./Dropdown";
import ValueInput from "./ValueInput";

const Filter = ({
  id,
  value,
  criterias,
  onChange,
  onAdd,
  onDelete
}) => {
  const [selectedCriteria, setSelectedCriteria] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const criteriaOptions = criterias.map(({ key, label }) => ({ value: key, label }));
  const criteriaObj = criterias.find(({ key }) => key === selectedCriteria);
  const operatorOptions = criteriaObj?.operators || [];
  const valueSettings = criteriaObj?.values || {};

  useEffect(() => {
    if(value){
      setSelectedCriteria(value.criteria);
      setSelectedOperator(value.operator);
      setSelectedValue(value.value);
    }
  }, [value])

  const handleChange = (prop, val) => {
    onChange({ ...value, [prop]: val });
  };


  // TODO: no es mejor hacer el change en el state del padre ??? pq guardo el state aca ???

  const handleChangeCriteria = (ev) => {
    const val = ev.target.value;
    setSelectedCriteria(val);
    handleChange("criteria", val);
  }

  const handleChangeOperator = (ev) => {
    const val = ev.target.value;
    setSelectedOperator(val);
    handleChange("operator", val);
  }

  const handleChangeValue = (ev) => {
    const val = ev.target.value;
    setSelectedValue(val);
    handleChange("value", val);
  }

  return (
    <Grid2 container spacing={2} sx={{ alignItems: "center" }}>
      <Grid2 size={11}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Dropdown
            id={`${id}-column`}
            value={selectedCriteria}
            placeholder={T.translate("grid_filter.select_criteria")}
            options={criteriaOptions}
            onChange={handleChangeCriteria}
          />
          <Dropdown
            id={`${id}-operator`}
            value={selectedOperator}
            placeholder={T.translate("grid_filter.select_operator")}
            options={operatorOptions}
            onChange={handleChangeOperator}
          />
          <ValueInput
            id={`${id}-value`}
            value={selectedValue}
            type={valueSettings.type}
            placeholder={T.translate("grid_filter.select_values")}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...valueSettings.props}
            onChange={handleChangeValue}
          />
        </Box>
      </Grid2>
      <Grid2 size={1}>
        {value ? (
          <Button
            variant="outlined"
            aria-label="delete"
            onClick={() => onDelete(id)}
          >
            <DeleteIcon />
          </Button>
        ) : (
          <Button variant="contained" aria-label="add" onClick={onAdd}>
            <AddIcon />
          </Button>
        )}
      </Grid2>
    </Grid2>
  );
};

Filter.propTypes = {
  id: PropTypes.string.isRequired,
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
  criterias: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      operators: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
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
