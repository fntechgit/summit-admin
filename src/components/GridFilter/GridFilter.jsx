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

import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Typography
} from "@mui/material";
import ToggleButtons from "./components/ToggleButtons";
import Filter from "./components/Filter";
import FilterButton from "./components/FilterButton";
import { saveFilters } from "./actions/filter-actions";
import useGridFilter, { EMPTY_FILTER } from "./hooks/useGridFilter";
import { JOIN_OPERATORS, OPERATORS } from "./utils";

const OPERATOR_VALUES = Object.values(OPERATORS).map((op) => op.value);

const GridFilter = ({ id, criterias, onApply, saveFilters }) => {
  const { joinOperator, filterCount, valuesWithIds } = useGridFilter(id);
  const valuesString = useMemo(
    () => valuesWithIds.map((v) => v.id).join(","),
    [valuesWithIds]
  );
  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState([]);
  const [andOrAny, setAndOrAny] = useState(joinOperator);

  useEffect(() => {
    if (openModal) {
      // we want to rest to applied filters when closing modal (Cancel)
      setFilters([...valuesWithIds, EMPTY_FILTER]);
      setAndOrAny(joinOperator);
    }
  }, [valuesString, joinOperator, openModal]);

  const parseFilter = (filter) => {
    const parser = criterias.find(
      ({ key }) => key === filter.criteria
    )?.customParser;
    if (parser) {
      return parser(filter);
    }
    const value = Array.isArray(filter.value)
      ? filter.value.join("||")
      : filter.value;
    if (value != null && value !== "") {
      return [`${filter.criteria}${filter.operator}${value}`];
    }
  };

  const handleChange = (filter) => {
    setFilters((prevFilters) =>
      prevFilters.map((f) => (f.id === filter.id ? filter : f))
    );
  };

  const handleAdd = () => {
    setFilters((prevFilters) => {
      // replacing "new" id and adding new empty filter
      const currentFilters = prevFilters.map((f, i) => ({
        ...f,
        id: `${f.criteria}-${i}`
      }));
      return [...currentFilters, EMPTY_FILTER];
    });
  };

  const handleRemove = (filter) => {
    setFilters((prevFilters) => prevFilters.filter((f) => f.id !== filter.id));
  };

  const handleClear = () => {
    setFilters([EMPTY_FILTER]);
  };

  const handleSubmit = () => {
    // remove empty filters and adding parsed string for API
    const validFilters = filters
      .filter(
        (f) =>
          f.criteria != null &&
          f.operator != null &&
          f.value != null &&
          f.value !== "" &&
          !(Array.isArray(f.value) && f.value.length === 0)
      )
      .map((f) => ({ ...f, parsed: parseFilter(f) }));

    saveFilters(id, validFilters, andOrAny);
    onApply(validFilters, andOrAny);
    setOpenModal(false);
  };

  const handleRemoveAndApply = () => {
    saveFilters(id);
    onApply([], JOIN_OPERATORS.ALL);
  };

  return (
    <>
      <FilterButton
        filterCount={filterCount}
        onClick={() => setOpenModal(true)}
        onDelete={handleRemoveAndApply}
      />
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Typography
              variant="body1"
              sx={{ fontSize: 16, lineHeight: "32px" }}
            >
              {T.translate("grid_filter.filter_by")}
            </Typography>
            <ToggleButtons
              options={Object.values(JOIN_OPERATORS)}
              value={andOrAny}
              onChange={setAndOrAny}
              name="and-or-any"
            />
            <Typography
              variant="body1"
              sx={{ fontSize: 16, lineHeight: "32px" }}
            >
              {T.translate("grid_filter.following")}
            </Typography>
          </Box>
          <Divider sx={{ m: "10px -24px" }} />
          <Box>
            {filters.map((filter) => (
              <Filter
                id={filter.id}
                key={`grid-filter-${filter.id}`}
                criterias={criterias}
                value={filter}
                onChange={handleChange}
                onAdd={handleAdd}
                onDelete={handleRemove}
              />
            ))}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="text"
            onClick={() => handleClear()}
            sx={{ mr: "auto" }}
          >
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
  id: PropTypes.string.isRequired,
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
  onApply: PropTypes.func,
  saveFilters: PropTypes.func.isRequired
};

GridFilter.defaultProps = {
  onApply: () => {}
};

export default connect(null, { saveFilters })(GridFilter);
