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

// icon-only toolbar buttons; the label stays as tooltip/aria-label
export const ICON_ONLY_BUTTON_SX = {
  minWidth: 0,
  "& .MuiButton-startIcon": { m: 0 }
};

// MUI's fontSize="large" size
const LARGE_ICON_PX = 35;

// GridActionsCellItem forces small icons; match uicore table's fontSize="large"
export const ACTION_ICON_SX = (theme) => ({
  fontSize: theme.typography.pxToRem(LARGE_ICON_PX)
});
