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

import { alpha } from "@mui/material";

// icon-only toolbar buttons; the label stays as tooltip/aria-label
export const ICON_ONLY_BUTTON_SX = {
  minWidth: 0,
  // the theme's 16px small-button padding is too wide around a lone icon
  px: 1,
  "& .MuiButton-startIcon": { m: 0 }
};

// uicore GridFilter's IconButton, sized and colored like the buttons above
export const FILTER_ICON_SX = {
  borderRadius: 1,
  // the theme's small-button padding with px: 1, around a small button's icon
  py: "9px",
  px: 1,
  "& svg": { fontSize: 18 },
  color: "primary.main",
  "&:hover": {
    bgcolor: (theme) =>
      alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity)
  }
};

// GridActionsCellItem forces small icons; match uicore table's medium (22px)
export const ACTION_ICON_SX = { fontSize: "1.375rem" };
