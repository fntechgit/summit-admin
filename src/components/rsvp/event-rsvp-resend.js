import React, { useState } from "react";
import { Input } from "openstack-uicore-foundation/lib/components";
import Swal from "sweetalert2";
import T from "i18n-react";
import { Modal } from "react-bootstrap";
import { validateEmail } from "../../utils/methods";

const EventRSVPReSend = ({ children, selectedCount, onReSend }) => {
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [excerptRecipient, setExcerptRecipient] = useState("");
  const [showBlastModal, setShowBlastModal] = useState(false);

  const handleDisplayBlastModal = () => {
    if (selectedCount === 0) {
      Swal.fire(
        "Validation error",
        T.translate("event_rsvp_list.select_rsvp_warning"),
        "warning"
      );
      return false;
    }

    if (testEmailRecipient !== "" && !validateEmail(testEmailRecipient)) {
      Swal.fire(
        "Validation error",
        T.translate("event_rsvp_list.invalid_recipient_email"),
        "warning"
      );
      return false;
    }

    setExcerptRecipient("");
    setShowBlastModal(true);
  };

  const handleReSend = () => {
    onReSend(testEmailRecipient, excerptRecipient);
    setShowBlastModal(false);
  };

  return (
    <>
      <div className="row form-group">
        <div className="col-md-7">
          <Input
            id="test_email_recipient"
            value={testEmailRecipient}
            onChange={(ev) => setTestEmailRecipient(ev.target.value)}
            placeholder={T.translate(
              "event_rsvp_list.placeholders.test_recipient"
            )}
            className="form-control"
          />
        </div>
        <div className="col-md-5">
          {children}
          <button
            className="btn btn-primary pull-right"
            type="button"
            onClick={handleDisplayBlastModal}
          >
            {T.translate("event_rsvp_list.re_send")}
          </button>
        </div>
      </div>

      <Modal show={showBlastModal} onHide={() => setShowBlastModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {T.translate("event_rsvp_list.re_send_modal_title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              {T.translate("event_rsvp_list.re_send_email_warning", {
                qty: selectedCount
              })}
            </div>
            {testEmailRecipient && (
              <div className="col-md-12">
                {T.translate("event_rsvp_list.email_test_recipient", {
                  email: testEmailRecipient
                })}
              </div>
            )}
            <div className="col-md-12 acceptance-criteria-wrapper">
              <label htmlFor="excerpt_recipient">
                {T.translate("event_rsvp_list.excerpt_recipient")}
              </label>
              <Input
                id="excerpt_email_recipient"
                value={excerptRecipient}
                onChange={(ev) => setExcerptRecipient(ev.target.value)}
                placeholder={T.translate(
                  "event_rsvp_list.placeholders.excerpt_recipient"
                )}
                className="form-control"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-primary" onClick={handleReSend}>
            {T.translate("event_rsvp_list.re_send_button")}
          </button>
          <button
            className="btn btn-default"
            onClick={() => setShowBlastModal(false)}
          >
            {T.translate("general.cancel")}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EventRSVPReSend;
