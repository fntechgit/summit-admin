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

import React, { useRef, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import EditSelectionPlanPage from "./edit-selection-plan-page";

const SelectionPlanPopup = ({ isEditing, onClose, onSaved, history }) => {
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  const handleSavingChange = (saving) => {
    isSavingRef.current = saving;
    setIsSaving(saving);
  };

  const handleClose = () => {
    if (isSavingRef.current) return;
    onClose();
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
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {isEditing ? T.translate("general.edit") : T.translate("general.add")}{" "}
        {T.translate("edit_selection_plan.selection_plan")}
        <IconButton size="small" onClick={handleClose} disabled={isSaving}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <EditSelectionPlanPage
          onSaved={onSaved}
          onSavingChange={handleSavingChange}
          history={history}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SelectionPlanPopup;
