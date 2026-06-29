/**
 * Copyright 2019 OpenStack Foundation
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
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import EditSelectionPlanPage from "./edit-selection-plan-page";

const SelectionPlanPopup = ({ isEditing, onClose, onSave, history }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSave = (values) => {
    if (isSaving) return Promise.resolve();
    setIsSaving(true);
    return Promise.resolve(onSave(values))
      .then(() => onClose())
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      disableEscapeKeyDown={isSaving}
      maxWidth="xl"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      PaperProps={{ sx: { height: "90vh" } }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {isEditing ? T.translate("general.edit") : T.translate("general.add")}{" "}
        {T.translate("edit_selection_plan.selection_plan")}
        <IconButton
          aria-label="Close"
          size="small"
          onClick={handleClose}
          disabled={isSaving}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ overflowY: "auto" }}>
        <EditSelectionPlanPage onSave={handleSave} history={history} />
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          type="submit"
          form="selection-plan-form"
          variant="contained"
          disabled={isSaving}
        >
          {T.translate("general.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SelectionPlanPopup.propTypes = {
  isEditing: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  history: PropTypes.shape({ push: PropTypes.func }).isRequired
};

SelectionPlanPopup.defaultProps = {
  isEditing: false
};

export default SelectionPlanPopup;
