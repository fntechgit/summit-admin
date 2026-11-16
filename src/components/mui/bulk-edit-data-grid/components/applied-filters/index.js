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
import PropTypes from "prop-types";
import { Box, Chip } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { useGridFilter } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { formatDate } from "../../../../../utils/methods";
import { LONG_DATETIME_FORMAT } from "../../../../../utils/constants";

// chip text for an applied filter, e.g. "Location: is Room A, Room B"
const getFilterChipLabel = (filter, criterias) => {
  const criteria = criterias.find(({ key }) => key === filter.criteria);
  if (!criteria) return filter.criteria;

  // the criteria's own operators, since BEFORE and LESS_OR_EQUAL share "<="
  const operator = criteria.operators.find(
    (op) => op.value === filter.operator
  );
  const { type, props } = criteria.values;
  const options =
    typeof props?.options === "function"
      ? props.options(filter.value)
      : props?.options;

  const toLabel = (v) => {
    // async inputs store option objects
    if (v != null && typeof v === "object") return v.label;
    if (type === "datetime") return formatDate(v, "LOC", LONG_DATETIME_FORMAT);
    return options?.find((o) => o.value === v)?.label ?? v;
  };
  const values = Array.isArray(filter.value) ? filter.value : [filter.value];
  const operatorLabel = operator?.label ?? filter.operator;
  const valueLabels = values.map(toLabel).join(", ");

  return `${criteria.label}: ${operatorLabel} ${valueLabels}`;
};

// own component so useGridFilter only runs when the grid has a filter
const AppliedFilters = ({ id, criterias }) => {
  const { valuesWithIds, setFilters, joinOperator } = useGridFilter(id);

  if (valuesWithIds.length === 0) return null;

  const handleRemoveFilter = (filterId) =>
    setFilters(
      valuesWithIds
        .filter((f) => f.id !== filterId)
        .map(({ id: _id, ...filter }) => filter),
      joinOperator
    );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
        width: "100%"
      }}
    >
      {valuesWithIds.map((filter) => (
        <Chip
          key={filter.id}
          size="small"
          icon={<FilterAltIcon />}
          label={getFilterChipLabel(filter, criterias)}
          onDelete={() => handleRemoveFilter(filter.id)}
        />
      ))}
    </Box>
  );
};

AppliedFilters.propTypes = {
  id: PropTypes.string.isRequired,
  criterias: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired
};

export default AppliedFilters;
