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
import { InputLabel, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const LabelWithInfo = ({ htmlFor, label, info }) => (
  <InputLabel
    htmlFor={htmlFor}
    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
  >
    {label}
    <Tooltip title={info}>
      <InfoOutlinedIcon fontSize="small" />
    </Tooltip>
  </InputLabel>
);

export default LabelWithInfo;
