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
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useField } from "formik";
import { Divider, IconButton, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const NotesModal = ({ item, open, onClose, onSave }) => {
  const name = `i-${item?.form_item_id}-c-global-f-notes`;
  // eslint-disable-next-line
  const [field, meta, helpers] = useField(name);
  const [notes, setNotes] = useState(field?.value || "");

  const handleSave = () => {
    helpers.setValue(notes);
    onClose();
    onSave();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {T.translate("edit_sponsor.cart_tab.edit_form.notes")}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500]
        })}
      >
        <CloseIcon />
      </IconButton>
      <Divider />
      <DialogContent>
        <DialogContentText>{item?.name}</DialogContentText>
        <TextField
          name={name}
          onChange={(ev) => setNotes(ev.target.value)}
          value={notes}
          margin="normal"
          multiline
          fullWidth
          rows={4}
          placeholder={T.translate(
            "edit_sponsor.cart_tab.edit_form.notes_placeholder"
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} variant="contained" fullWidth>
          {T.translate("general.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

NotesModal.propTypes = {
  item: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default NotesModal;
