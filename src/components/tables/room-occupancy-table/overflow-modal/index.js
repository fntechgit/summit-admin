import { Modal } from "react-bootstrap";
import T from "i18n-react";
import React, { useState } from "react";
import PropTypes from "prop-types";

function OverflowModal({ room, show, onHide, onSave, onDelete }) {
  const [streamUrl, setStreamUrl] = useState(
    room?.overflow_streamming_url || ""
  );
  const [isSecure, setIsSecure] = useState(
    room?.overflow_stream_is_secure || false
  );

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Overflow Stream</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ overflow: "auto", maxHeight: "75vh" }}>
        <div className="row">
          <div className="col-md-12">
            <label htmlFor="stream_url">Stream URL</label>
            <input
              id="stream_url"
              type="text"
              className="form-control"
              placeholder="Stream URL"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
            <div className="checkboxes-div">
              <div className="form-check abc-checkbox">
                <input
                  type="checkbox"
                  id="is_secure"
                  checked={isSecure}
                  onChange={(e) => setIsSecure(e.target.checked)}
                  className="form-check-input"
                />
                <label className="form-check-label" htmlFor="is_secure">
                  Is Secure ?
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {room?.overflow_streamming_url && (
          <button className="btn btn-danger" onClick={() => onDelete(room)}>
            {T.translate("general.remove")}
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={() => onSave(room, isSecure, streamUrl)}
        >
          {T.translate("general.save")}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

OverflowModal.propTypes = {
  room: PropTypes.object,
  show: PropTypes.bool,
  onHide: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func
};

export default OverflowModal;
