import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import T from "i18n-react";
import { Input } from "@mui/material";

const ImportMUXModal = ({ show, onClose, onImport }) => {
  const [tokenId, setTokenId] = useState("");
  const [tokenSecret, setTokenSecret] = useState("");
  const [emailTo, setEmailTo] = useState("");

  const handleClose = () => {
    setTokenId("");
    setTokenSecret("");
    setEmailTo("");
    onClose();
  };

  const handleImport = (ev) => {
    ev.preventDefault();
    onImport(tokenId, tokenSecret, emailTo).then(() => {
      handleClose();
    });
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{T.translate("event_list.mux_import")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-4">
            <label htmlFor="mux_token_id">
              {" "}
              {T.translate("event_list.mux_token_id")}
            </label>
            &nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("event_list.mux_token_id_info")}
            />
            <Input
              id="mux_token_id"
              value={tokenId}
              onChange={(ev) => setTokenId(ev.target.value)}
              className="form-control"
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="mux_token_secret">
              {" "}
              {T.translate("event_list.mux_token_secret")}
            </label>
            &nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("event_list.mux_token_secret_info")}
            />
            <Input
              id="mux_token_secret"
              value={tokenSecret}
              onChange={(ev) => setTokenSecret(ev.target.value)}
              className="form-control"
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="mux_email_to">
              {" "}
              {T.translate("event_list.mux_email_to")}
            </label>
            &nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("event_list.mux_email_to_info")}
            />
            <Input
              id="mux_email_to"
              type="email"
              value={emailTo}
              onChange={(ev) => setEmailTo(ev.target.value)}
              className="form-control"
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          className="btn btn-primary"
          onClick={handleImport}
          type="button"
        >
          {T.translate("event_list.import")}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImportMUXModal;
