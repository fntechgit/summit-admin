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
  Menu,
  MenuItem,
  Box,
  Button,
  Typography,
  Checkbox
} from "@mui/material";
import DisplayButton from "./components/DisplayButton";
import { saveColumns } from "./actions/display-control-actions";


const GridDisplayControl = ({ id, columns, selected, saveColumns }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const allChecked = useMemo(() => columns.every((col) => selected.find(s => s === col.key)), [columns, selected]);
  const someChecked = useMemo(() => columns.some((col) => selected.find(s => s === col.key)), [columns, selected]);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onReset = () => {}

  const toggleAll = () => {}


  return (
    <>
      <DisplayButton
        showDot={false}
        onClick={(ev) => setAnchorEl(ev.currentTarget)}
      />
      <Menu
        id={`${id}-display-control-list`}
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          popover: {
            sx: {
              // Shift 0px horizontally, and 30px downward from the button
              transform: "translate(0px, 30px)",
            },
          },
        }}
      >
        { columns.map((col) => (
          <MenuItem key={`col-item-${col.key}`} disabled={col.fixed} onClick={handleClose}>
            <Checkbox checked={selected.find(s => s === col.key)} size="small" sx={{ p: 0, mr: 1 }} />
            {col.label}
          </MenuItem>
        ))}

        <MenuItem sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }} onClick={toggleAll}>
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              size="small"
              sx={{ p: 0, mr: 1 }}
            />
            <Typography variant="body2">
              {T.translate("grid_display_control.show_hide")}
            </Typography>
          </Box>
          <Button size="small" onClick={onReset} sx={{ minWidth: 0, fontSize: 12 }}>
            {T.translate("grid_display_control.reset")}
          </Button>
        </MenuItem>
      </Menu>
    </>
  );
};

GridDisplayControl.propTypes = {
  id: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  saveColumns: PropTypes.func.isRequired,
};

export default connect(null, { saveColumns })(GridDisplayControl);
