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

import React, { useRef } from "react";
import PropTypes from "prop-types";
import {
  GridPreferencePanelsValue,
  GridToolbarColumnsButton,
  gridPreferencePanelStateSelector,
  useGridApiContext,
  useGridSelector
} from "@mui/x-data-grid";
import { ICON_ONLY_BUTTON_SX } from "../../constants";

// clicking the button while its panel is open should close it, but React 16
// runs the button's handlers on document, next to the panel's click-away
// listener, so the button can't stop it: the panel closes on pointerup and the
// button's click reopens it. Remember whether it was open when the press
// started and close it again after the click.
const ColumnsButton = ({ buttonRef }) => {
  const apiRef = useGridApiContext();
  const preferencePanel = useGridSelector(
    apiRef,
    gridPreferencePanelStateSelector
  );
  const wasOpenRef = useRef(false);

  return (
    <GridToolbarColumnsButton
      ref={buttonRef}
      slotProps={{
        button: {
          sx: ICON_ONLY_BUTTON_SX,
          onPointerDown: () => {
            wasOpenRef.current =
              preferencePanel.open &&
              preferencePanel.openedPanelValue ===
                GridPreferencePanelsValue.columns;
          },
          onClick: () => {
            if (wasOpenRef.current) apiRef.current.hidePreferences();
            wasOpenRef.current = false;
          }
        }
      }}
    />
  );
};

ColumnsButton.propTypes = {
  buttonRef: PropTypes.func.isRequired
};

export default ColumnsButton;
