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
import { Chip, IconButton } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import T from "i18n-react/dist/i18n-react";

const FilterButton = ({ filterCount, onClick, onDelete }) => {
  if (filterCount > 0) {
    return (
      <Chip
        icon={<FilterListIcon fontSize="large" />}
        label={`${filterCount} ${T.translate("grid_filter.filters")}`}
        onClick={onClick}
        onDelete={onDelete}
        sx={{
          "& .MuiChip-label": { fontSize: "13px" },
          backgroundColor: "grey.700",
          color: "white",
          "& .MuiChip-icon": { color: "white" },
          "& .MuiChip-deleteIcon": {
            color: "rgba(255,255,255,0.7)",
            "&:hover": { color: "white" }
          }
        }}
      />
    );
  }

  return (
    <IconButton
      size="large"
      aria-label={T.translate("grid_filter.open_filters")}
      onClick={onClick}
      sx={{ mr: 1, top: "-6px", position: "relative" }}
    >
      <FilterListIcon fontSize="large" />
    </IconButton>
  );
};

FilterButton.propTypes = {
  filterCount: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default FilterButton;
