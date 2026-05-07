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
import T from "i18n-react/dist/i18n-react";
import { Button, Dialog, DialogActions, DialogContent, Divider, IconButton, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ToggleButtons from "./components/ToggleButtons";
import Box from "@mui/material/Box";
import Filter from "./components/Filter";

// sample settings
/*
settings = {
  criteria: {
    options: [
      { value: "name", label: "Name" },
      { value: "email", label: "Email" },
    ],
    placeholder: "Select a criteria",
  },
  operator: {
    options: [
      { value: "eq", label: "Equals" },
      { value: "ne", label: "Not Equals" },
      { value: "gt", label: "Greater Than" },
      { value: "lt", label: "Less Than" },
    ],
    placeholder: "Select an operator",
  },
  value: {
    type: "ValueInput", // class name of the component to render the value
    props: {
      type: "text", // props to pass to the component
    },
  }
}


 */

const GridFilter = ({values, settings}) => {
  const [openModal, setOpenModal] = useState(false);


  const handleChange = (val) => {}

  const handleClear = () => {}

  const handleSubmit = () => {}

  return (
    <>
      <IconButton
        size="small"
        onClick={() => setOpenModal(true)}
        sx={{ mr: 1 }}
      >
        <FilterListIcon fontSize="small" />
      </IconButton>
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <Typography variant="body2">{T.translate("grid_filter.filter_by")}</Typography>
          <ToggleButtons options={["All", "Any"]} onChange={(val) => handleChange(val)} />
          <Typography variant="body2">{T.translate("grid_filter.following")}</Typography>
          <Divider />
          <Box>
            {values.map(({criteria, value}, index) => (
              <Filter
                id={`grid-filter-${index}`}
                value={value}
                criteriaSettings={settings.criteria}
                operatorSettings={settings[criteria].operator}
                valueSettings={settings[criteria].value}
                onChange={() => {}}
                onAdd={() => {}}
                onDelete={() => {}}
              />
            ))}
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
