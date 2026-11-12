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
import { getFilterChipLabel } from "../../../../../pages/events/summit-event-list-page/helpers";

// own component so useGridFilter only runs when the grid has a filter
const AppliedFilters = ({ id, criterias }) => {
  const { valuesWithIds, setFilters, joinOperator } = useGridFilter(id);

  if (valuesWithIds.length === 0) return null;

  const handleRemoveFilter = (filterId) =>
    setFilters(
      valuesWithIds.filter((f) => f.id !== filterId),
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
