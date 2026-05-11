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

import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ToggleButtons from "./components/ToggleButtons";
import Filter from "./components/Filter";

const OPERATORS = [
  { value: "==", label: "is" },
  { value: "=@", label: "like" },
  { value: "@@", label: "like start" },
  { value: "<>", label: "is not" },
  { value: ">>", label: "has" },
  { value: "!>>", label: "has not" },
  { value: "<", label: "less than" },
  { value: "<=", label: "less than or equal to" },
  { value: ">", label: "greater than" },
  { value: ">=", label: "greater than or equal to" },
  { value: "[]", label: "between" },
  { value: "()", label: "between strict" }
];

// sample props
/*
criterias =  [
    {
      key: "tracks",
      label: "Tracks",
      operators: [
        {value: "==", label: "is"},
        {value: "=@", label: "like"},
      ],
      values: {
        type: "select",
        props: {
          options: [
            {value: 1, label: "OpenStack"},
            {value: 2, label: "FnTech"}
          ],
          multi: true,
          placeholder: "Select Tracks"
        },
      },
    },
    {
      key: "sponsor",
      label: "Sponsor",
      operators: [
        {value: "==", label: "is"},
        {value: "=@", label: "like"},
      ],
      values: {
        type: "text",
        props: {
          placeholder: "Type Sponsor Name"
        },
      },
    }
  ]


value = [
  {
    criteria: "tracks",
    operator: "==",
    value: [1, 2]
  },
  {
    criteria: "sponsor",
    operator: "=@",
    value: "openstack"
  }
]


 */

const GridFilter = ({ values, criterias, onApply }) => {
  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState(values);
  const criteriaOptions = criterias.map((c) => ({
    label: c.label,
    value: c.key
  }));

  const handleChange = (filter) => {
    setFilters((prevFilters) => ({ ...prevFilters, filter }));
    console.log("change filter", filter);
  };

  const handleAdd = () => {
    console.log("add filter");
  };

  const handleRemove = (filter) => {
    setFilters((prevFilters) =>
      prevFilters.filter((f) => f !== filter.criteria)
    );
    console.log("remove filter", filter);
  };

  const handleClear = () => {
    console.log("clear filters");
  };

  const handleSubmit = () => {
    console.log("save filters", filters);
    onApply(filters);
  };

  return (
    <>
      <IconButton
        size="large"
        onClick={() => setOpenModal(true)}
        sx={{ mr: 1, top: "-6px", position: "relative" }}
      >
        <FilterListIcon fontSize="large" />
      </IconButton>
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Typography variant="body2">
              {T.translate("grid_filter.filter_by")}
            </Typography>
            <ToggleButtons
              options={["All", "Any"]}
              onChange={(val) => handleChange(val)}
              name="and-or-any"
            />
            <Typography variant="body2">
              {T.translate("grid_filter.following")}
            </Typography>
          </Box>
          <Divider />
          <Box>
            {values.map((value, index) => {
              const criteria = criterias.find((c) => c.key === value.criteria);

              return (
                <Filter
                  id={`grid-filter-${index}`}
                  key={`grid-filter-${index}`}
                  criterias={criterias}
                  value={value}
                  onChange={handleChange}
                  onAdd={handleAdd}
                  onDelete={handleRemove}
                />
              );
            })}
            <Filter
              id="grid-filter-new"
              criterias={criterias}
              onChange={handleChange}
              onAdd={handleAdd}
              onDelete={handleRemove}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" onClick={() => handleClear()}>
            {T.translate("grid_filter.clear_filters")}
          </Button>
          <Button variant="outlined" onClick={() => setOpenModal(false)}>
            {T.translate("grid_filter.cancel")}
          </Button>
          <Button variant="contained" onClick={() => handleSubmit()}>
            {T.translate("grid_filter.apply_filters")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

GridFilter.propTypes = {
  values: PropTypes.arrayOf(
    PropTypes.shape({
      criteria: PropTypes.string.isRequired,
      operator: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(
          PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        )
      ]).isRequired
    })
  ),
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
  ).isRequired
};

GridFilter.defaultProps = {
  values: []
};

export default GridFilter;
