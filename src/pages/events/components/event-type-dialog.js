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
import { connect } from "react-redux";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import EventTypeForm from "../../../components/forms/event-type-form";
import {
  linkToPresentationType as linkToPresentationTypeAction,
  unlinkFromPresentationType as unlinkFromPresentationTypeAction,
  queryMediaUploads
} from "../../../actions/media-upload-actions";

const EventTypeDialog = ({
  currentSummit,
  entity,
  errors,
  onClose,
  onSave,
  linkToPresentationType,
  unlinkFromPresentationType
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleOnSave = (eventTypeEntity) => {
    if (isSaving) return;
    setIsSaving(true);
    Promise.resolve(onSave(eventTypeEntity))
      .then(() => onClose())
      .catch(() => {
        // keep dialog open on save error to preserve user input
      })
      .finally(() => setIsSaving(false));
  };

  const getMediaUploads = (input, callback) => {
    if (!input) return Promise.resolve({ options: [] });
    return queryMediaUploads(currentSummit.id, input, callback);
  };

  const isEdit = Boolean(entity.id);
  const title = `${T.translate(
    isEdit ? "general.edit" : "general.add"
  )} ${T.translate("edit_event_type.event_type")}`;

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {title}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ mr: 1 }}
          disabled={isSaving}
          aria-label="close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <EventTypeForm
          currentSummit={currentSummit}
          entity={entity}
          errors={errors}
          onSubmit={handleOnSave}
          getMediaUploads={getMediaUploads}
          onMediaUploadLink={linkToPresentationType}
          onMediaUploadUnLink={unlinkFromPresentationType}
          isSaving={isSaving}
        />
      </DialogContent>
    </Dialog>
  );
};

EventTypeDialog.propTypes = {
  currentSummit: PropTypes.shape({ id: PropTypes.number }).isRequired,
  entity: PropTypes.shape({ id: PropTypes.number }).isRequired,
  errors: PropTypes.shape({}),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  linkToPresentationType: PropTypes.func.isRequired,
  unlinkFromPresentationType: PropTypes.func.isRequired
};

EventTypeDialog.defaultProps = {
  errors: {}
};

const mapStateToProps = ({ currentSummitState, currentEventTypeState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventTypeState
});

export default connect(mapStateToProps, {
  linkToPresentationType: linkToPresentationTypeAction,
  unlinkFromPresentationType: unlinkFromPresentationTypeAction
})(EventTypeDialog);
