import React, { useState } from "react";
import T from "i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";
import { useSnackbarMessage } from "openstack-uicore-foundation/lib/components/mui/snackbar-notification";

const ImportModal = ({ show, onClose, onImport }) => {
  const { errorMessage } = useSnackbarMessage();
  const [importFile, setImportFile] = useState(null);
  const [sendSpeakerEmail, setSendSpeakerEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    setImportFile(null);
    setSendSpeakerEmail(false);
    onClose();
  };

  const handleImportEvents = () => {
    if (!importFile || isSaving) return;
    setIsSaving(true);
    onImport(importFile, sendSpeakerEmail)
      .then(() => {
        handleClose();
      })
      .catch((error) => {
        errorMessage(
          T.translate("event_list.import_events_error", {
            error: error.message || error
          })
        );
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <Dialog
      open={show}
      onClose={handleClose}
      disableEscapeKeyDown={isSaving}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        component="div"
        sx={{ display: "flex", justifyContent: "space-between" }}
      >
        <Typography variant="h5">
          {T.translate("event_list.import_events")}
        </Typography>
        <IconButton
          size="small"
          onClick={handleClose}
          disabled={isSaving}
          aria-label="close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          {T.translate("event_list.import_events_format_header")}
          <br />
          {T.translate("event_list.import_events_format_minimal")}
          <br />
          {T.translate("event_list.import_events_format_title")}
          <br />
          {T.translate("event_list.import_events_format_description")}
          <br />
          {T.translate("event_list.import_events_format_type_id")}
          <br />
          {T.translate("event_list.import_events_format_track_id")}
          <br />
          {T.translate("event_list.import_events_format_speaker_emails")}
          <br />
          {T.translate("event_list.import_events_format_speaker_fullnames")}
          <br />
          {T.translate("event_list.import_events_format_speaker_companies")}
          <br />
          {T.translate("event_list.import_events_format_speaker_titles")}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <UploadInput
            value={importFile && importFile?.name}
            handleUpload={(file) => setImportFile(file)}
            handleRemove={() => setImportFile(null)}
            className="dropzone col-md-6"
            multiple={false}
            accept=".csv"
          />
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={sendSpeakerEmail}
              onChange={(ev) => setSendSpeakerEmail(ev.target.checked)}
            />
          }
          label={T.translate("event_list.send_speaker_email")}
        />
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          variant="contained"
          fullWidth
          disabled={!importFile || isSaving}
          onClick={handleImportEvents}
        >
          {T.translate("event_list.ingest")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportModal;
