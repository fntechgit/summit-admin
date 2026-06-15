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
import { Badge, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import T from "i18n-react/dist/i18n-react";

const DisplayButton = ({ showDot, onClick }) => (
  <Badge color="primary" variant="dot" invisible={!showDot}>
    <IconButton
      size="large"
      aria-label={T.translate("grid_display.open_control")}
      onClick={onClick}
      sx={{ mr: 1, top: "-6px", position: "relative" }}
    >
      <VisibilityIcon fontSize="large" />
    </IconButton>
  </Badge>
);

DisplayButton.propTypes = {
  showDot: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

export default DisplayButton;
