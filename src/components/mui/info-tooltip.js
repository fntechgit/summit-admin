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
import { Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const InfoTooltip = ({
  title,
  color = "text.secondary",
  fontSize,
  ...rest
}) => (
  <Tooltip
    title={title}
    slotProps={fontSize ? { tooltip: { sx: { fontSize } } } : undefined}
    {...rest}
  >
    <InfoOutlinedIcon
      fontSize="small"
      sx={{ ml: 0.5, verticalAlign: "middle", color }}
    />
  </Tooltip>
);

InfoTooltip.propTypes = {
  title: PropTypes.node.isRequired,
  color: PropTypes.string,
  fontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default InfoTooltip;
