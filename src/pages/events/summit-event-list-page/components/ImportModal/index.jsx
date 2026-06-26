import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import T from "i18n-react";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";

const ImportModal = ({ show, onClose, onImport }) => {
  const [importFile, setImportFile] = useState(null);
  const [sendSpeakerEmail, setSendSpeakerEmail] = useState(false);

  const handleClose = () => {
    setImportFile(null);
    setSendSpeakerEmail(false);
    onClose();
  };

  const handleImportEvents = () => {
    if (importFile) {
      onImport(importFile, sendSpeakerEmail);
    }

    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{T.translate("event_list.import_events")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12">
            Format must be the following:
            <br />
            (Minimal data required)
            <br />
            * title ( text )<br />
            * description (text )<br />
            * type_id (int) or type (string type name)
            <br />
            * track_id (int) or track ( string track name)
            <br />
            * speaker_emails ( list of email | delimited) [optional]
            <br />
            * speaker_fullnames ( list of full names | delimited) [optional]
            <br />
            * speaker_companies ( list of companies | delimited) [optional]
            <br />
            * speaker_titles ( list of titles | delimited) [optional]
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
