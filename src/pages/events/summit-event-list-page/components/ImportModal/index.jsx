import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import T from "i18n-react";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";
import { useSnackbarMessage } from "openstack-uicore-foundation/lib/components/mui/snackbar-notification";

const ImportModal = ({ show, onClose, onImport }) => {
  const { errorMessage } = useSnackbarMessage();
  const [importFile, setImportFile] = useState(null);
  const [sendSpeakerEmail, setSendSpeakerEmail] = useState(false);

  const handleClose = () => {
    setImportFile(null);
    setSendSpeakerEmail(false);
    onClose();
  };

  const handleImportEvents = () => {
    if (!importFile) return;

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
      });
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{T.translate("event_list.import_events")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12">
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
            <br />
            <br />
          </div>
          <div className="col-md-12 ticket-import-upload-wrapper">
            <UploadInput
              value={importFile && importFile?.name}
              handleUpload={(file) => setImportFile(file)}
              handleRemove={() => setImportFile(null)}
              className="dropzone col-md-6"
              multiple={false}
              accept=".csv"
            />
          </div>
          <div className="col-md-12 checkboxes-div">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="send_speaker_email"
                checked={sendSpeakerEmail}
                onChange={(ev) => setSendSpeakerEmail(ev.target.checked)}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="send_speaker_email">
                {T.translate("event_list.send_speaker_email")}
              </label>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          disabled={!importFile}
          className="btn btn-primary"
          onClick={handleImportEvents}
          type="button"
        >
          {T.translate("event_list.ingest")}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImportModal;
